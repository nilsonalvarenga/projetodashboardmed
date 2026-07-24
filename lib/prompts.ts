// ============================================================
//  Núcleo de segurança clínica — contratos de prompt para a IA.
//  Regra de ouro: apoio à decisão. A decisão final é SEMPRE do médico.
// ============================================================
import type { ClinicalCategory } from './categories';

export interface RetrievedChunk {
  n: number;            // índice de citação [n]
  chunk_id: string;
  document_id: string;
  titulo: string;
  autor?: string | null;
  pagina?: number | null;
  category: ClinicalCategory;
  content: string;
  similarity: number;
}

export interface ClinicalCaseInput {
  idade?: number; sexo?: string; peso_kg?: number; altura_m?: number; imc?: number;
  queixa_principal?: string; historia_clinica?: string; doencas_previas?: string;
  medicacoes_uso?: string; alergias?: string; exames_lab?: string; exames_imagem?: string;
  objetivo_consulta?: string; restricoes_paciente?: string; observacoes_medico?: string;
}

// ---------- SYSTEM PROMPT (resposta clínica) ----------
export const CLINICAL_SYSTEM_PROMPT = `Você é um assistente de APOIO à decisão médica para uso interno de um único médico.
Você NÃO substitui o julgamento clínico. A decisão final é SEMPRE do médico.

REGRAS ABSOLUTAS (nunca violar):
1. NÃO invente condutas, doses, fórmulas, exames ou medicações. Se não houver base, diga "não encontrado na base".
2. "Informações encontradas na base" devem vir EXCLUSIVAMENTE dos TRECHOS fornecidos no contexto (RAG). Cada afirmação tirada da base PRECISA citar a fonte no formato [n], onde n é o número do trecho.
3. Separe sempre e de forma explícita:
   - INFORMAÇÃO DA BASE (com citação [n]);
   - RACIOCÍNIO CLÍNICO INFERIDO (marcado como "inferido — requer validação", sem citação da base);
   - PONTOS QUE PRECISAM DE CONFIRMAÇÃO do médico;
   - ALERTAS DE SEGURANÇA.
4. NÃO copie conteúdo protegido na íntegra. Use apenas paráfrase técnica curta e cite a fonte interna.
5. Priorize SEGURANÇA CLÍNICA. Sempre verifique e sinalize quando relevante: contraindicações, interações medicamentosas, gestação/lactação, idosos, insuficiência renal, insuficiência hepática, alergias, risco cardiovascular e risco psiquiátrico.
6. Doses/condutas só podem ser apresentadas se estiverem nos trechos da base, citadas com [n]. Caso contrário, recomende avaliação/validação — não estime.
7. Se o contexto da base estiver vazio ou irrelevante, deixe claro que não há respaldo na base e ofereça apenas perguntas e raciocínio geral marcado como inferido.

SAÍDA: responda ESTRITAMENTE em JSON válido (sem markdown, sem texto fora do JSON), no formato:
{
  "resumo_caso": string,
  "problemas_principais": string[],
  "raciocinio_clinico": string,                       // hipóteses/raciocínio — marque o que é inferido
  "informacoes_da_base": [{"texto": string, "fontes": number[]}],   // cada item cita [n]
  "conduta_sugerida": [{"texto": string, "origem": "base"|"inferido", "fontes": number[]}],
  "exames_considerar": [{"texto": string, "origem": "base"|"inferido", "fontes": number[]}],
  "medicacoes_suplementos": [{"nome": string, "detalhe": string, "fontes": number[]}],
  "contraindicacoes_alertas": string[],
  "perguntas_para_fechar": string[],
  "plano_acompanhamento": string[],
  "fontes_internas": number[],                        // todos os [n] efetivamente usados
  "aviso": string                                     // lembrete de que a decisão é do médico
}
Se um campo não tiver respaldo, use lista vazia e explique em "perguntas_para_fechar" ou "contraindicacoes_alertas".`;

// ---------- Monta o contexto RAG + o caso ----------
export function buildClinicalUserPrompt(c: ClinicalCaseInput, chunks: RetrievedChunk[]): string {
  const ctx = chunks.length
    ? chunks
        .map(
          (k) =>
            `[${k.n}] (${k.category}) "${k.titulo}"${k.autor ? ' — ' + k.autor : ''}${
              k.pagina ? ', p.' + k.pagina : ''
            } | similaridade ${k.similarity.toFixed(2)}\n${k.content}`,
        )
        .join('\n\n')
    : '(NENHUM trecho relevante foi recuperado na base do médico.)';

  const caso = JSON.stringify(c, null, 2);

  return `CASO CLÍNICO (entrada do médico):\n${caso}

TRECHOS RECUPERADOS DA BASE DO MÉDICO (única fonte permitida para "informacoes_da_base"; cite por [n]):
${ctx}

Gere a resposta no JSON especificado, respeitando todas as REGRAS ABSOLUTAS. Cite [n] sempre que usar a base. Não invente nada fora dos trechos.`;
}

// ---------- Classificação automática de chunk (Ciclo 3) ----------
export function buildChunkClassifyPrompt(content: string): string {
  return `Classifique o trecho clínico abaixo em UMA categoria da lista (responda só o JSON {"category": "...","confidence":0..1}).
Categorias válidas: medicacao, vitamina, suplemento, exame, diagnostico, conduta, contraindicacao, interacao_medicamentosa, protocolo, alimentacao_dieta, hormonios, obesidade_metabolismo, tireoide, diabetes, longevidade, estetica, sono, dor, psiquiatria, outros.

TRECHO:
"""${content.slice(0, 1500)}"""`;
}

// ---------- Extração estruturada (Ciclo 4) ----------
// Para cada tipo, a IA extrai SOMENTE o que estiver no trecho; campos ausentes = null.
export const EXTRACTION_SYSTEM_PROMPT = `Você extrai dados estruturados de trechos clínicos para revisão humana posterior.
NÃO invente. Se a informação não estiver no trecho, use null. Sempre preencha "fonte_trecho" com uma citação curta (<= 240 caracteres) do próprio trecho. Responda só JSON.`;

export function buildExtractionPrompt(kind: 'medicacao' | 'suplemento' | 'conduta' | 'protocolo', content: string): string {
  const shapes: Record<string, string> = {
    medicacao: `{"itens":[{"nome","classe","dose_citada","frequencia","indicacao","contraindicacoes","efeitos_adversos","interacoes","observacoes","fonte_trecho"}]}`,
    suplemento: `{"itens":[{"nome","dose","forma","indicacao","sinais_deficiencia","riscos","interacoes","exames_relacionados","observacoes","fonte_trecho"}]}`,
    conduta: `{"itens":[{"problema_clinico","criterios_inclusao","criterios_exclusao","passo_a_passo","exames_antes","exames_seguimento","medicacoes_associadas","suplementacao_associada","dieta_estilo_vida","alertas","fonte_trecho"}]}`,
    protocolo: `{"itens":[{"titulo","objetivo","publico_alvo","avaliacao_inicial","exames","intervencao","acompanhamento","criterios_parada","riscos","fonte_trecho"}]}`,
  };
  return `Extraia ${kind}(s) do trecho. Campos ausentes = null. Formato: ${shapes[kind]}

TRECHO:
"""${content.slice(0, 4000)}"""`;
}
