# Configurar o Supabase (banco + pgvector + storage)

Passo a passo para ligar o banco e deixar o sistema 100% funcional.

## 1. Criar o projeto

1. Acesse [supabase.com](https://supabase.com) e crie um projeto (o plano **free** já inclui `pgvector`).
2. Escolha uma senha forte para o banco e uma região próxima do Brasil (ex.: `South America (São Paulo)`).

## 2. Rodar a migração (schema)

1. No painel do Supabase, abra **SQL Editor → New query**.
2. Cole **todo** o conteúdo de `supabase/migrations/0001_init.sql` e clique em **Run**.
3. Isso cria:
   - extensões `vector`, `pgcrypto`, `pg_trgm`;
   - os `ENUM`s e as **14 tabelas** (`documents`, `document_chunks`, `extracted_*`, `clinical_cases`, `clinical_chat_messages`, `citations`, `rag_retrieval_logs`, `review_queue`, `audit_logs`, ...);
   - a função de busca vetorial **`match_chunks()`** (cosine + filtros);
   - índice **HNSW** no embedding e as políticas de **RLS**.

> Se `create index ... using hnsw` falhar (pgvector < 0.5), troque por `ivfflat`:
> `create index on document_chunks using ivfflat (embedding vector_cosine_ops) with (lists = 100);`

## 3. Storage (opcional, recomendado)

Em **Storage → New bucket**, crie um bucket **privado** chamado `documents`
(guarda os arquivos originais; a ingestão funciona mesmo sem ele).

## 4. Pegar as chaves

Em **Project Settings → API**, copie:

| Campo no painel | Variável em `.env.local` |
|---|---|
| Project URL | `NEXT_PUBLIC_SUPABASE_URL` |
| `anon` `public` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| `service_role` `secret` | `SUPABASE_SERVICE_ROLE_KEY` |

> A `service_role` ignora o RLS e **só pode** ficar no servidor. Nunca a coloque em variável `NEXT_PUBLIC_*`.

## 5. Chaves de IA

- **OpenAI** (embeddings obrigatórios): crie em [platform.openai.com/api-keys](https://platform.openai.com/api-keys) → `OPENAI_API_KEY`.
- **Claude** (opcional, para gerar a resposta): [console.anthropic.com](https://console.anthropic.com) → `ANTHROPIC_API_KEY` e set `LLM_PROVIDER=anthropic`.

## 6. Preencher `.env.local` e reiniciar

Edite `.env.local` na raiz, salve e reinicie o servidor (`iniciar.bat`).
Confira o status em **http://localhost:3000/settings** — quando os 3 itens ficarem ✅, está pronto.

## Verificação rápida (SQL)

```sql
select count(*) from documents;
select extname from pg_extension where extname = 'vector';
select proname from pg_proc where proname = 'match_chunks';
```
