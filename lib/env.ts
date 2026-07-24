// Detecção de configuração. Permite rodar o app em "modo configuração pendente"
// (UI navegável) antes de o médico preencher as chaves de Supabase/OpenAI/Claude.
// IMPORTANTE: segredos (service_role, OPENAI_API_KEY) só existem no servidor.

export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  supabaseAnon: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  serviceRole: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  openaiKey: process.env.OPENAI_API_KEY || '',
  anthropicKey: process.env.ANTHROPIC_API_KEY || '',
  llmProvider: (process.env.LLM_PROVIDER || 'openai').toLowerCase(),
  appName: process.env.NEXT_PUBLIC_APP_NAME || 'Dashboard Médico RAG',
};

// Reconhece placeholders do .env.example (não configurado de verdade).
const isPlaceholder = (v: string): boolean =>
  !v || /SEU-PROJETO|^sk-\.\.\.$|^sk-ant-\.\.\.$|^eyJ\.\.\.$|^\.\.\.$/.test(v.trim());

export function hasSupabase(): boolean {
  return (
    !isPlaceholder(env.supabaseUrl) &&
    !isPlaceholder(env.serviceRole) &&
    /^https?:\/\//.test(env.supabaseUrl)
  );
}

export function hasEmbeddings(): boolean {
  return !isPlaceholder(env.openaiKey);
}

export function hasLLM(): boolean {
  return env.llmProvider === 'anthropic'
    ? !isPlaceholder(env.anthropicKey)
    : !isPlaceholder(env.openaiKey);
}

export interface ConfigStatus {
  supabase: boolean;
  embeddings: boolean;
  llm: boolean;
  provider: string;
  ready: boolean;
}

export function configStatus(): ConfigStatus {
  const supabase = hasSupabase();
  const embeddings = hasEmbeddings();
  const llm = hasLLM();
  return { supabase, embeddings, llm, provider: env.llmProvider, ready: supabase && embeddings && llm };
}
