'use client';
import { useFetch } from '@/hooks/useFetch';
import { PageHeader, Card, Spinner } from '@/components/ui';

const ENV_TEMPLATE = `# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...        # só no servidor — nunca expor

# Embeddings (OpenAI)
OPENAI_API_KEY=sk-...
EMBEDDING_MODEL=text-embedding-3-small

# Geração da resposta clínica
LLM_PROVIDER=openai                     # openai | anthropic
OPENAI_CHAT_MODEL=gpt-4.1
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_CHAT_MODEL=claude-sonnet-4-6

# RAG
RAG_MATCH_COUNT=8
RAG_SIMILARITY_THRESHOLD=0.2`;

function StatusRow({ ok, label, detail }: { ok: boolean; label: string; detail: string }) {
  return (
    <div className="flex items-start gap-3 py-2 border-b border-slate-100 last:border-0">
      <span className="text-lg">{ok ? '✅' : '⬜'}</span>
      <div>
        <div className="font-semibold text-navy text-sm">{label}</div>
        <div className="text-xs text-slate-500">{detail}</div>
      </div>
      <span className={`badge ml-auto ${ok ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{ok ? 'OK' : 'pendente'}</span>
    </div>
  );
}

export default function SettingsPage() {
  const { data, loading } = useFetch<any>('/api/health');

  return (
    <div className="max-w-3xl">
      <PageHeader title="Configurações" subtitle="Status de conexão e passo a passo para deixar o sistema 100% funcional (banco + IA)." />

      {loading ? <Spinner /> : (
        <Card className="mb-5">
          <div className="section-title mb-2">Status atual {data?.ready && <span className="text-emerald-600">— tudo pronto 🎉</span>}</div>
          <StatusRow ok={!!data?.supabase} label="Supabase (PostgreSQL + pgvector)" detail="Banco, busca vetorial e armazenamento das extrações." />
          <StatusRow ok={!!data?.embeddings} label="OpenAI — embeddings" detail="text-embedding-3-small (1536 dims) para indexar e buscar." />
          <StatusRow ok={!!data?.llm} label={`LLM de resposta (${data?.provider || 'openai'})`} detail="Gera a resposta clínica estruturada com baixa temperatura." />
        </Card>
      )}

      <Card className="mb-5">
        <h2 className="font-bold text-navy mb-2">1. Banco de dados (Supabase)</h2>
        <ol className="list-decimal pl-5 text-sm text-slate-600 space-y-1.5">
          <li>Crie um projeto em <a className="link" href="https://supabase.com" target="_blank" rel="noreferrer">supabase.com</a> (free tier serve).</li>
          <li>No <b>SQL Editor</b>, cole e rode o arquivo <code className="bg-slate-100 px-1 rounded">supabase/migrations/0001_init.sql</code> — ele cria a extensão <code className="bg-slate-100 px-1 rounded">vector</code>, todas as tabelas, a função <code className="bg-slate-100 px-1 rounded">match_chunks()</code> e o RLS.</li>
          <li>Em <b>Storage</b>, crie um bucket privado chamado <code className="bg-slate-100 px-1 rounded">documents</code>.</li>
          <li>Em <b>Project Settings → API</b>, copie a URL, a <code className="bg-slate-100 px-1 rounded">anon key</code> e a <code className="bg-slate-100 px-1 rounded">service_role key</code>.</li>
        </ol>
      </Card>

      <Card className="mb-5">
        <h2 className="font-bold text-navy mb-2">2. Variáveis de ambiente</h2>
        <p className="text-sm text-slate-600 mb-2">Crie o arquivo <code className="bg-slate-100 px-1 rounded">.env.local</code> na raiz do projeto e reinicie o servidor (<code className="bg-slate-100 px-1 rounded">npm run dev</code>):</p>
        <pre className="bg-navy-900 text-slate-100 text-xs rounded-lg p-4 overflow-x-auto">{ENV_TEMPLATE}</pre>
      </Card>

      <Card className="bg-slate-50">
        <h2 className="font-bold text-navy mb-2">Segurança & LGPD</h2>
        <ul className="list-disc pl-5 text-sm text-slate-600 space-y-1">
          <li>Sistema de <b>uso interno</b>. A <code className="bg-slate-100 px-1 rounded">service_role key</code> só existe no servidor (API routes) — nunca no navegador.</li>
          <li>RLS habilitado: leitura só para usuários autenticados; escrita de conteúdo via backend.</li>
          <li>O acervo é conteúdo protegido — o sistema usa apenas <b>trechos curtos + paráfrase</b> e sempre cita a fonte interna. Não expor publicamente.</li>
          <li>Toda interação do chat é registrada em <code className="bg-slate-100 px-1 rounded">audit_logs</code> e <code className="bg-slate-100 px-1 rounded">rag_retrieval_logs</code>.</li>
          <li><b>Apoio à decisão.</b> A decisão final, a prescrição e a responsabilidade são sempre do médico.</li>
        </ul>
      </Card>
    </div>
  );
}
