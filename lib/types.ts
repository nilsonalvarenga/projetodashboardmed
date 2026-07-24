// Tipos do domínio (espelham o schema 0001_init.sql).
import type { ClinicalCategory } from './categories';

export type UserRole = 'admin' | 'medico' | 'revisor' | 'leitor';
export type ContentType = 'pdf' | 'docx' | 'txt' | 'markdown' | 'csv' | 'xlsx' | 'transcricao' | 'anotacao' | 'outro';
export type DocStatus = 'recebido' | 'processando' | 'indexado' | 'erro' | 'arquivado';
export type ReviewStatus = 'pendente' | 'revisado' | 'aprovado' | 'rejeitado' | 'precisa_corrigir';

export interface DocumentMeta {
  id: string;
  titulo: string;
  autor?: string | null;
  source_id?: string | null;
  curso_origem?: string | null;
  modulo_aula?: string | null;
  tema_principal?: string | null;
  tipo: ContentType;
  data_conteudo?: string | null;
  tags: string[];
  observacoes?: string | null;
  status: DocStatus;
  total_chunks: number;
  created_at: string;
}

export interface DocumentChunk {
  id: string;
  document_id: string;
  chunk_index: number;
  content: string;
  pagina?: number | null;
  category: ClinicalCategory;
  category_conf?: number | null;
  status: ReviewStatus;
}

// Resposta estruturada do chat clínico (12 seções) — veja lib/prompts.ts
export interface ClinicalAnswer {
  resumo_caso: string;
  problemas_principais: string[];
  raciocinio_clinico: string;
  informacoes_da_base: { texto: string; fontes: number[] }[];
  conduta_sugerida: { texto: string; origem: 'base' | 'inferido'; fontes: number[] }[];
  exames_considerar: { texto: string; origem: 'base' | 'inferido'; fontes: number[] }[];
  medicacoes_suplementos: { nome: string; detalhe: string; fontes: number[] }[];
  contraindicacoes_alertas: string[];
  perguntas_para_fechar: string[];
  plano_acompanhamento: string[];
  fontes_internas: number[];
  aviso: string;
}
