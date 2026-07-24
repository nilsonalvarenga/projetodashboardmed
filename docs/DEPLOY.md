# Deploy em produção (nuvem)

Arquitetura recomendada: **Vercel** (Next.js — frontend + API routes) + **Supabase** (PostgreSQL + pgvector + storage).
O build de produção roda no Linux da Vercel — sem o problema de `readlink` que ocorre em discos exFAT no Windows.

## 1. Banco (Supabase)

Já está pronto se você seguiu [SUPABASE.md](SUPABASE.md). Em produção:
- Mantenha o **RLS ligado** (o backend usa a `service_role`, que ignora RLS).
- Antes de uso real, **adicione login** (Supabase Auth) e checagem de sessão/role nas rotas `app/api/*`.

## 2. Frontend/API (Vercel)

1. Suba o projeto para um repositório Git (GitHub/GitLab). **Não** versione `.env.local`, `node_modules/`, `.next/`, `.runtime/` (já estão no `.gitignore`).
2. Em [vercel.com](https://vercel.com) → **New Project** → importe o repositório (framework detectado: **Next.js**).
3. Em **Settings → Environment Variables**, adicione (mesmas do `.env.local`):

   ```
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   SUPABASE_SERVICE_ROLE_KEY        ← marque como "Sensitive" / só servidor
   OPENAI_API_KEY
   EMBEDDING_MODEL=text-embedding-3-small
   LLM_PROVIDER=openai              ← ou anthropic
   OPENAI_CHAT_MODEL=gpt-4.1
   ANTHROPIC_API_KEY                ← se usar Claude
   ANTHROPIC_CHAT_MODEL=claude-sonnet-4-6
   RAG_MATCH_COUNT=8
   RAG_SIMILARITY_THRESHOLD=0.2
   NEXT_PUBLIC_APP_NAME=Dashboard Médico RAG
   ```

4. **Deploy.** A Vercel roda `npm install` + `next build` automaticamente.

> **Timeouts:** ingestão e chat podem demorar. As rotas já declaram `maxDuration` (300s/120s).
> No plano Hobby da Vercel o limite é menor — para acervos grandes, use plano Pro ou processe a ingestão em lotes.

## 3. Build local de produção (opcional)

No Windows, faça em disco **NTFS** (ex.: `C:`), pois exFAT quebra o `next build`:

```powershell
# a partir de uma cópia em C:\
npm install
npm run build
npm start        # http://localhost:3000
```

No Linux/macOS, basta `npm install && npm run build && npm start`.

## 4. Checklist antes de produção real

- [ ] Login/autenticação (Supabase Auth) ativo e exigido nas rotas.
- [ ] RLS revisado por tabela; `service_role` só no servidor.
- [ ] Conteúdo protegido: confirmar que só trechos/paráfrase são exibidos (sem cópia integral).
- [ ] Monitorar custos de API (OpenAI/Anthropic) e limites de rate.
- [ ] Backups do banco (Supabase) e política de retenção dos logs de auditoria (LGPD).
