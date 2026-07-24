// Classificação dos chunks. Heurística rápida (default) — sem custo de API.
// A classificação por LLM está disponível em prompts.ts (buildChunkClassifyPrompt)
// e pode substituir esta função quando precisão for prioridade sobre custo.
import type { ClinicalCategory } from './categories';

const RULES: [ClinicalCategory, RegExp][] = [
  ['interacao_medicamentosa', /intera(ç|c)(ã|a)o|interage|concomit/i],
  ['contraindicacao', /contraindica|n[ãa]o (usar|utilizar)|evitar em|gestante|gravidez|lacta/i],
  ['protocolo', /protocolo|passo a passo|fase\s?\d/i],
  ['medicacao', /\b(mg|mcg|comprimido|c[áa]psula|posologia|dose|metformina|levotiroxina)\b/i],
  ['vitamina', /vitamina|b12|vit\.?\s?d\b|[áa]cido f[óo]lico/i],
  ['suplemento', /suplement|creatina|[ôo]mega|magn[ée]sio|coenzima|whey|col[áa]geno/i],
  ['exame', /exame|tsh|glicemia|insulina|ferritina|hemograma|laborat/i],
  ['tireoide', /tireoide|hipotireoid|hashimoto|\bt3\b|\bt4\b/i],
  ['diabetes', /diabet|glicad|hba1c|resist[êe]ncia insul/i],
  ['hormonios', /horm[ôo]nio|cortisol|estrog|testosterona|progesterona/i],
  ['obesidade_metabolismo', /obesidade|emagrec|metabol|\bimc\b|gordura/i],
  ['alimentacao_dieta', /dieta|alimenta|jejum|card[áa]pio|low ?carb|cetog/i],
  ['sono', /sono|ins[ôo]nia|melatonina/i],
  ['dor', /\bdor\b|analg[ée]|enxaqueca|cefal/i],
  ['psiquiatria', /ansiedade|depress|psiqui|compuls/i],
  ['estetica', /est[ée]tica|botox|preenchimento/i],
  ['longevidade', /longevidade|envelhec|anti-?aging/i],
  ['diagnostico', /diagn[óo]stico|hip[óo]tese/i],
  ['conduta', /conduta|tratamento|manejo|orienta(ç|c)/i],
];

export function classifyHeuristic(text: string): { category: ClinicalCategory; confidence: number } {
  for (const [cat, re] of RULES) if (re.test(text)) return { category: cat, confidence: 0.55 };
  return { category: 'outros', confidence: 0.3 };
}
