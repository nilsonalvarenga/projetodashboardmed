# Dashboard Médico RAG

Sistema **interno** de apoio à decisão médica. O médico cadastra conteúdos autorizados
(PDFs, transcrições, apostilas, protocolos, tabelas de medicações/suplementos/exames),
o sistema indexa esse acervo com **RAG (busca vetorial)** e, num chat clínico, gera
**raciocínio e conduta sugeridos com base apenas no acervo**, sempre **citando as fontes internas**.

> ⚠️ **Apoio à decisão. A decisão final é sempre do médico.** O sistema não inventa condutas;
> separa o que veio da base do que é raciocínio inferido; e prioriza segurança clínica.

---

## ✅ Começo rápido (Windows, localhost)

O projeto já vem com um **Node.js portátil** em `.runtime/` e as dependências instaladas.

1. **Iniciar o servidor** — dê **duplo-clique em `iniciar.bat`** (ou rode `./start-dev.ps1` no PowerShell).
2. Abra **http://localhost:3000** no navegador.
3. O app abre em **modo demonstração** (interface navegável). Para ativar ingestão e chat,
   preencha as chaves em **`.env.local`** (veja [Configurações](#3-configuração-banco--ia)) e reinicie.

> Não precisa instalar nada. Se quiser usar seu próprio Node (18+), basta `npm install` e `npm run dev`.

---

## Arquitetura

```
Next.js 14 (App Router) + React + TailwindCSS        ← frontend (dashboard responsivo)
        │  app/api/*  (API routes, server-only)
        ▼
Pipeline de ingestão            RAG / Chat clínico
  extrai → limpa → chunk →        embed(query) → match_chunks() →
  embed → classifica →            monta contexto [n] → LLM (JSON 12 seções) →
  salva chunks + extrações        cita fontes + loga auditoria
        │                               │
        ▼                               ▼
PostgreSQL (Supabase) + pgvector  ──────────────  OpenAI (embeddings + chat) | Claude (chat)
  documents, document_chunks(embedding), extracted_*, clinical_cases,
  clinical_chat_messages, citations, rag_retrieval_logs, review_queue, audit_logs
```

**Decisões-chave**
- **Embeddings:** OpenAI `text-embedding-3-small` (1536 dims) — casa com `vector(1536)` no schema.
- **Geração:** OpenAI (`gpt-4.1`, JSON-mode) **ou** Claude (`claude-sonnet-4-6`) via `LLM_PROVIDER`.
- **Busca:** função SQL `match_chunks()` (cosine, índice HNSW) com filtros por categoria/fonte e *threshold*.
- **Segurança clínica** centralizada em `lib/prompts.ts` (regras absolutas + formato de resposta).
- **Revisão humana** obrigatória: chunks e extrações nascem `pendente`; protocolo só vira "oficial" após aprovação.
- **Modo demonstração:** sem chaves, a UI roda e mostra um banner de setup; ingestão/chat retornam 503 com instrução.

## Estrutura do projeto

```
app/
  (app)/                 # páginas com sidebar (layout + SetupBanner)
    dashboard, documents, documents/[id], documents/upload, knowledge,
    medications, supplements, protocols, conducts,
    cases, cases/new, cases/[id], chat, review, settings
  api/                   # endpoints server-only
    health, stats, documents, documents/[id], ingest, extract, extractions,
    search, chat, cases, cases/[id], review, sources
components/              # Sidebar, ui, SetupBanner, ClinicalAnswer, ExtractionList
hooks/useFetch.ts        # GET/POST JSON helpers (client)
lib/
  prompts.ts             # ★ núcleo de segurança clínica (system prompt, 12 seções, extração)
  ai.ts                  # embeddings + geração (OpenAI/Claude) + parse JSON
  rag.ts                 # caseToQuery + retrieve() via match_chunks
  ingest.ts / chunk.ts / extract.ts / classify.ts / extractStructured.ts
  env.ts                 # detecção de configuração (modo demo)
  supabaseServer.ts      # clientes Supabase (admin service_role / anon)
  categories.ts / types.ts
supabase/migrations/0001_init.sql   # ★ schema completo + pgvector + match_chunks + RLS
docs/                    # SUPABASE.md, DEPLOY.md
iniciar.bat / start-dev.ps1         # launchers (Node portátil em .runtime/)
```

## Telas (frontend)

| Rota | Função |
|---|---|
| `/dashboard` | Totais (documentos, chunks, medicações, suplementos, protocolos, condutas), casos recentes, revisão pendente |
| `/documents` · `/documents/[id]` | Lista do acervo; detalhe com metadados, chunks e contagem de extrações |
| `/documents/upload` | Envio (PDF, DOCX, TXT, MD, CSV, XLSX, transcrição, anotação) + metadados |
| `/knowledge` | Busca por palavra-chave + similaridade semântica, com filtro por categoria |
| `/medications` `/supplements` `/protocols` `/conducts` | Listagens das extrações estruturadas |
| `/cases` · `/cases/new` · `/cases/[id]` | Casos clínicos: lista, novo, histórico com respostas da IA |
| `/chat` | Chat clínico RAG — entrada do caso → resposta nas 12 seções com citações |
| `/review` | Fila de revisão: editar, aprovar, corrigir ou rejeitar cada extração |
| `/settings` | Status de conexão + passo a passo de configuração + LGPD |

## Modelo de segurança da resposta (12 seções)

Toda resposta do chat sai em JSON e é renderizada nestas seções, com as **4 separações** explícitas:
1. Resumo do caso · 2. Problemas principais · 3. Raciocínio clínico *(marca o que é **inferido**)* ·
4. **Informações da base** *(com citação `[n]`)* · 5. Conduta sugerida (origem: base/inferido) ·
6. Exames a considerar · 7. Medicações/suplementos da base · 8. **Contraindicações e alertas** ·
9. **Perguntas que faltam** · 10. Plano de acompanhamento · 11. **Fontes internas** · 12. Aviso (decisão do médico).

Regras impostas ao modelo: não inventar; "base" só dos trechos recuperados; citar `[n]`;
não copiar conteúdo protegido (paráfrase curta); checar contraindicações, interações,
gestação/lactação, idosos, insuf. renal/hepática, alergias, risco CV e psiquiátrico.

---

## 3. Configuração (banco + IA)

Veja o passo a passo completo em **[docs/SUPABASE.md](docs/SUPABASE.md)**. Resumo:

1. Crie um projeto em [supabase.com](https://supabase.com) (free tier serve).
2. No **SQL Editor**, rode `supabase/migrations/0001_init.sql` (cria `vector`, tabelas, `match_chunks()`, RLS).
3. Em **Storage**, crie um bucket privado `documents`.
4. Preencha **`.env.local`** com as chaves do Supabase + `OPENAI_API_KEY` (e, se quiser Claude, `ANTHROPIC_API_KEY` + `LLM_PROVIDER=anthropic`).
5. Reinicie (`iniciar.bat`). O banner de setup some quando tudo estiver verde (confira em `/settings`).

## Teste de ponta a ponta (Ciclo 8)

1. `/documents/upload` → envie um PDF/TXT do acervo. Status vira **indexado** (chunks + embeddings gerados).
2. `/documents/[id]` → **Extrair estruturado** (a IA extrai medicações/suplementos/condutas/protocolos).
3. `/review` → aprove/edite as extrações (protocolo aprovado vira oficial).
4. `/chat` → descreva um caso clínico → resposta nas 12 seções **citando as fontes internas**.

## Deploy em produção (nuvem)

Veja **[docs/DEPLOY.md](docs/DEPLOY.md)**. Em resumo: **Vercel** (frontend/API) + **Supabase** (banco).
O build de produção (`next build`) roda sem problemas no Linux da Vercel.

> ⚠️ **Build local no Windows:** este projeto está num disco **exFAT** (`D:`), que não suporta
> `symlink`/`readlink`. Por isso `next build` **local** falha aqui (erro `EISDIR readlink`). O **dev**
> (`npm run dev`) funciona normalmente, e o **build na nuvem (Linux) também**. Se precisar buildar
> localmente, copie o projeto para um disco **NTFS** (ex.: `C:`) e rode lá.

## Segurança & LGPD

- **Login (Supabase Auth)** ativo: quando o Supabase está configurado, `middleware.ts` exige sessão em todas as páginas e APIs (páginas → `/login`; APIs → 401). Em modo demonstração (sem chaves) o app fica aberto para você navegar.
- Uso **interno**. `service_role` só no servidor (API routes) — nunca no navegador.
- RLS habilitado no banco. Acervo protegido: só **trechos curtos + paráfrase**, sempre com fonte. Não expor publicamente.
- Auditoria em `audit_logs` e `rag_retrieval_logs` (com `user_id` de quem fez a ação).

### Papéis e permissões

Cada usuário tem um papel em `public.users.role`. As rotas sensíveis checam a capacidade (403 se faltar), e a Sidebar esconde o que o papel não pode usar:

| Papel | Ler acervo | Chat / Casos | Enviar / Extrair | Revisar / Aprovar |
|---|:-:|:-:|:-:|:-:|
| **admin** | ✅ | ✅ | ✅ | ✅ |
| **medico** | ✅ | ✅ | ✅ | ✅ |
| **revisor** | ✅ | — | — | ✅ |
| **leitor** | ✅ | — | — | — |

Trocar papel: `update public.users set role = 'revisor' where email = 'fulano@exemplo.com';`

## Status dos ciclos

- [x] **1** arquitetura + estrutura · [x] **2** schema + pgvector + RLS · [x] **3** ingestão (chunk/embeddings/classificação)
- [x] **4** extração estruturada IA · [x] **5** dashboard + listagens · [x] **6** chat RAG (12 seções + citações)
- [x] **7** revisão médica · [x] **8** fluxo de teste documentado · [x] **9** documentação + launchers + modo demo
- [x] **Login (Supabase Auth)** — middleware protege páginas e APIs quando configurado
- [x] **Papéis** (admin/médico/revisor/leitor) — permissões por rota + Sidebar adaptada + auditoria com autor
- [ ] **Próximo** (opcional) tela de gestão de usuários/papéis na UI
