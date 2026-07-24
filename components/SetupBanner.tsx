'use client';
import { useFetch } from '@/hooks/useFetch';

// Banner global de configuração: aparece enquanto faltam chaves (Supabase/OpenAI/LLM).
// Permite navegar o app em "modo configuração pendente" sem quebrar.
export default function SetupBanner() {
  const { data } = useFetch<{ supabase: boolean; embeddings: boolean; llm: boolean; provider: string; ready: boolean }>(
    '/api/health',
  );
  if (!data || data.ready) return null;

  const items = [
    { ok: data.supabase, label: 'Supabase (banco + pgvector)', env: 'NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY' },
    { ok: data.embeddings, label: 'OpenAI embeddings', env: 'OPENAI_API_KEY' },
    { ok: data.llm, label: `LLM de resposta (${data.provider})`, env: data.provider === 'anthropic' ? 'ANTHROPIC_API_KEY' : 'OPENAI_API_KEY' },
  ];

  return (
    <div className="mb-6 rounded-xl2 border border-amber-300 bg-amber-50 p-4">
      <div className="flex items-start gap-3">
        <span className="text-xl leading-none">⚙️</span>
        <div className="text-sm">
          <p className="font-bold text-amber-900">Configuração pendente — modo demonstração</p>
          <p className="text-amber-800 mt-0.5">
            A interface está navegável, mas a ingestão e o chat clínico só funcionam após preencher as chaves em{' '}
            <code className="bg-amber-100 px-1 rounded">.env.local</code> e reiniciar o servidor.
          </p>
          <ul className="mt-2 space-y-1">
            {items.map((it) => (
              <li key={it.label} className="flex items-center gap-2">
                <span>{it.ok ? '✅' : '⬜'}</span>
                <span className={it.ok ? 'text-amber-700' : 'text-amber-900 font-medium'}>
                  {it.label}
                  {!it.ok && <code className="ml-2 text-[11px] bg-amber-100 px-1 rounded">{it.env}</code>}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
