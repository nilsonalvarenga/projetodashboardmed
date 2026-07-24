-- ============================================================
--  Dashboard Médico RAG — Schema inicial (PostgreSQL / Supabase)
--  Requer extensão pgvector. Embeddings: OpenAI text-embedding-3-small (1536 dims).
--  Apoio à decisão médica — uso interno. A decisão final é sempre do médico.
-- ============================================================
create extension if not exists vector;
create extension if not exists pgcrypto;       -- gen_random_uuid()
create extension if not exists pg_trgm;         -- busca por palavra-chave (trigram)

-- ---------- ENUMs ----------
do $$ begin
  create type user_role as enum ('admin','medico','revisor','leitor');
exception when duplicate_object then null; end $$;

do $$ begin
  create type content_type as enum ('pdf','docx','txt','markdown','csv','xlsx','transcricao','anotacao','outro');
exception when duplicate_object then null; end $$;

do $$ begin
  create type doc_status as enum ('recebido','processando','indexado','erro','arquivado');
exception when duplicate_object then null; end $$;

-- Taxonomia de classificação dos trechos (chunks) e extrações
do $$ begin
  create type clinical_category as enum (
    'medicacao','vitamina','suplemento','exame','diagnostico','conduta',
    'contraindicacao','interacao_medicamentosa','protocolo','alimentacao_dieta',
    'hormonios','obesidade_metabolismo','tireoide','diabetes','longevidade',
    'estetica','sono','dor','psiquiatria','outros'
  );
exception when duplicate_object then null; end $$;

-- Estado de revisão humana (vale para chunks e extrações)
do $$ begin
  create type review_status as enum ('pendente','revisado','aprovado','rejeitado','precisa_corrigir');
exception when duplicate_object then null; end $$;

-- ---------- Trigger utilitário updated_at ----------
create or replace function set_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end; $$ language plpgsql;

-- ============================================================
--  USERS (perfil ligado ao Supabase Auth)
-- ============================================================
create table if not exists users (
  id          uuid primary key references auth.users(id) on delete cascade,
  nome        text not null,
  email       text unique not null,
  role        user_role not null default 'medico',
  ativo       boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger trg_users_updated before update on users for each row execute function set_updated_at();

-- ============================================================
--  DOCUMENT_SOURCES (curso / origem / professor) — normaliza a procedência
-- ============================================================
create table if not exists document_sources (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null,                 -- ex.: "PEF-360", "SEF 2025", "Acervo próprio"
  autor       text,                          -- autor/professor responsável
  descricao   text,
  created_by  uuid references users(id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger trg_sources_updated before update on document_sources for each row execute function set_updated_at();

-- ============================================================
--  DOCUMENTS (metadados do conteúdo enviado)
-- ============================================================
create table if not exists documents (
  id            uuid primary key default gen_random_uuid(),
  titulo        text not null,
  autor         text,                         -- autor/professor
  source_id     uuid references document_sources(id) on delete set null,
  curso_origem  text,                         -- texto livre quando não normalizado
  modulo_aula   text,
  tema_principal text,
  tipo          content_type not null default 'outro',
  data_conteudo date,                         -- data do material (não do upload)
  tags          text[] not null default '{}',
  observacoes   text,
  storage_path  text,                         -- caminho no Supabase Storage
  mime          text,
  tamanho_bytes bigint,
  hash_sha256   text,                         -- dedupe de arquivos idênticos
  status        doc_status not null default 'recebido',
  erro_msg      text,
  total_chunks  int not null default 0,
  created_by    uuid references users(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists idx_documents_status on documents(status);
create index if not exists idx_documents_tipo on documents(tipo);
create index if not exists idx_documents_tags on documents using gin(tags);
create index if not exists idx_documents_titulo_trgm on documents using gin(titulo gin_trgm_ops);
create trigger trg_documents_updated before update on documents for each row execute function set_updated_at();

-- ============================================================
--  DOCUMENT_CHUNKS (texto fatiado + embedding pgvector)
-- ============================================================
create table if not exists document_chunks (
  id            uuid primary key default gen_random_uuid(),
  document_id   uuid not null references documents(id) on delete cascade,
  chunk_index   int not null,
  content       text not null,                -- trecho curto (citação técnica, não cópia integral)
  token_count   int,
  pagina        int,                          -- página de origem (PDF), quando disponível
  category      clinical_category not null default 'outros',
  category_conf real,                         -- confiança da classificação (0..1)
  embedding     vector(1536),                 -- text-embedding-3-small
  metadata      jsonb not null default '{}',
  status        review_status not null default 'pendente',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (document_id, chunk_index)
);
create index if not exists idx_chunks_document on document_chunks(document_id);
create index if not exists idx_chunks_category on document_chunks(category);
create index if not exists idx_chunks_status on document_chunks(status);
create index if not exists idx_chunks_content_trgm on document_chunks using gin(content gin_trgm_ops);
-- Índice vetorial (cosine). HNSW exige pgvector >= 0.5; se indisponível, use ivfflat.
create index if not exists idx_chunks_embedding_hnsw
  on document_chunks using hnsw (embedding vector_cosine_ops);
create trigger trg_chunks_updated before update on document_chunks for each row execute function set_updated_at();

-- ============================================================
--  EXTRAÇÕES ESTRUTURADAS (IA) — sempre com fonte + revisão humana
-- ============================================================
create table if not exists extracted_medications (
  id              uuid primary key default gen_random_uuid(),
  document_id     uuid not null references documents(id) on delete cascade,
  chunk_id        uuid references document_chunks(id) on delete set null,
  nome            text not null,
  classe          text,
  dose_citada     text,
  frequencia      text,
  indicacao       text,
  contraindicacoes text,
  efeitos_adversos text,
  interacoes      text,
  observacoes     text,
  confianca       real,
  fonte_trecho    text,                        -- trecho curto que embasou a extração
  status          review_status not null default 'pendente',
  revisado_por    uuid references users(id),
  revisado_em     timestamptz,
  created_by      uuid references users(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists idx_med_status on extracted_medications(status);
create index if not exists idx_med_nome_trgm on extracted_medications using gin(nome gin_trgm_ops);
create trigger trg_med_updated before update on extracted_medications for each row execute function set_updated_at();

create table if not exists extracted_supplements (
  id              uuid primary key default gen_random_uuid(),
  document_id     uuid not null references documents(id) on delete cascade,
  chunk_id        uuid references document_chunks(id) on delete set null,
  nome            text not null,
  dose            text,
  forma           text,                        -- cápsula, sublingual, etc.
  indicacao       text,
  sinais_deficiencia text,
  riscos          text,
  interacoes      text,
  exames_relacionados text,
  observacoes     text,
  confianca       real,
  fonte_trecho    text,
  status          review_status not null default 'pendente',
  revisado_por    uuid references users(id),
  revisado_em     timestamptz,
  created_by      uuid references users(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists idx_sup_status on extracted_supplements(status);
create index if not exists idx_sup_nome_trgm on extracted_supplements using gin(nome gin_trgm_ops);
create trigger trg_sup_updated before update on extracted_supplements for each row execute function set_updated_at();

create table if not exists extracted_conducts (
  id                uuid primary key default gen_random_uuid(),
  document_id       uuid not null references documents(id) on delete cascade,
  chunk_id          uuid references document_chunks(id) on delete set null,
  problema_clinico  text not null,
  criterios_inclusao  text,
  criterios_exclusao  text,
  passo_a_passo     text,
  exames_antes      text,
  exames_seguimento text,
  medicacoes_associadas text,
  suplementacao_associada text,
  dieta_estilo_vida text,
  alertas           text,
  confianca         real,
  fonte_trecho      text,
  status            review_status not null default 'pendente',
  revisado_por      uuid references users(id),
  revisado_em       timestamptz,
  created_by        uuid references users(id),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists idx_cond_status on extracted_conducts(status);
create trigger trg_cond_updated before update on extracted_conducts for each row execute function set_updated_at();

create table if not exists extracted_protocols (
  id              uuid primary key default gen_random_uuid(),
  document_id     uuid not null references documents(id) on delete cascade,
  chunk_id        uuid references document_chunks(id) on delete set null,
  titulo          text not null,
  objetivo        text,
  publico_alvo    text,
  avaliacao_inicial text,
  exames          text,
  intervencao     text,
  acompanhamento  text,
  criterios_parada text,
  riscos          text,
  confianca       real,
  fonte_trecho    text,
  -- protocolo "oficial" só após revisão/aprovação humana
  oficial         boolean not null default false,
  status          review_status not null default 'pendente',
  revisado_por    uuid references users(id),
  revisado_em     timestamptz,
  created_by      uuid references users(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists idx_proto_status on extracted_protocols(status);
create index if not exists idx_proto_oficial on extracted_protocols(oficial);
create trigger trg_proto_updated before update on extracted_protocols for each row execute function set_updated_at();

-- ============================================================
--  CASOS CLÍNICOS + CHAT
-- ============================================================
create table if not exists clinical_cases (
  id            uuid primary key default gen_random_uuid(),
  titulo        text,
  idade         int,
  sexo          text,
  peso_kg       numeric(6,2),
  altura_m      numeric(4,2),
  imc           numeric(5,2),
  queixa_principal text,
  historia_clinica text,
  doencas_previas  text,
  medicacoes_uso   text,
  alergias         text,
  exames_lab       text,
  exames_imagem    text,
  objetivo_consulta text,
  restricoes_paciente text,
  observacoes_medico  text,
  status        text not null default 'aberto',  -- aberto | em_analise | concluido
  created_by    uuid references users(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists idx_cases_created_by on clinical_cases(created_by);
create index if not exists idx_cases_created_at on clinical_cases(created_at desc);
create trigger trg_cases_updated before update on clinical_cases for each row execute function set_updated_at();

create table if not exists clinical_chat_messages (
  id            uuid primary key default gen_random_uuid(),
  case_id       uuid references clinical_cases(id) on delete cascade,
  role          text not null default 'user',    -- user | assistant | system
  content       text,                            -- texto livre (entrada do médico ou resposta)
  structured    jsonb,                           -- resposta nas 12 seções (quando assistant)
  model         text,                            -- ex.: gpt-4.1 / claude-...
  tokens_prompt int,
  tokens_completion int,
  versao        int not null default 1,
  created_by    uuid references users(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists idx_msgs_case on clinical_chat_messages(case_id, created_at);
create trigger trg_msgs_updated before update on clinical_chat_messages for each row execute function set_updated_at();

-- ============================================================
--  RAG / CITAÇÕES / AUDITORIA / REVISÃO
-- ============================================================
create table if not exists rag_retrieval_logs (
  id            uuid primary key default gen_random_uuid(),
  message_id    uuid references clinical_chat_messages(id) on delete cascade,
  case_id       uuid references clinical_cases(id) on delete set null,
  query         text not null,
  filtros       jsonb not null default '{}',     -- categorias, fontes, threshold
  retrieved     jsonb not null default '[]',     -- [{chunk_id, document_id, score, category}]
  model_embed   text,
  match_count   int,
  latency_ms    int,
  created_by    uuid references users(id),
  created_at    timestamptz not null default now()
);
create index if not exists idx_rag_message on rag_retrieval_logs(message_id);

create table if not exists citations (
  id            uuid primary key default gen_random_uuid(),
  message_id    uuid references clinical_chat_messages(id) on delete cascade,
  chunk_id      uuid references document_chunks(id) on delete set null,
  document_id   uuid references documents(id) on delete set null,
  trecho        text,                            -- snippet curto citado
  pagina        int,
  score         real,
  created_at    timestamptz not null default now()
);
create index if not exists idx_citations_message on citations(message_id);

create table if not exists review_queue (
  id            uuid primary key default gen_random_uuid(),
  entity_type   text not null,                   -- 'chunk'|'medication'|'supplement'|'conduct'|'protocol'
  entity_id     uuid not null,
  status        review_status not null default 'pendente',
  prioridade    int not null default 0,
  notas         text,
  atribuido_a   uuid references users(id),
  revisado_por  uuid references users(id),
  revisado_em   timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists idx_review_status on review_queue(status, prioridade desc);
create index if not exists idx_review_entity on review_queue(entity_type, entity_id);
create trigger trg_review_updated before update on review_queue for each row execute function set_updated_at();

create table if not exists audit_logs (
  id            bigint generated always as identity primary key,
  user_id       uuid references users(id) on delete set null,
  action        text not null,                   -- 'upload','ingest','chat','approve','reject','login'...
  entity        text,
  entity_id     uuid,
  meta          jsonb not null default '{}',
  ip            text,
  user_agent    text,
  created_at    timestamptz not null default now()
);
create index if not exists idx_audit_user on audit_logs(user_id);
create index if not exists idx_audit_action on audit_logs(action);
create index if not exists idx_audit_created on audit_logs(created_at desc);

-- ============================================================
--  FUNÇÃO DE BUSCA VETORIAL (RAG) — cosine, com filtros
--  Por padrão retorna apenas chunks de documentos indexados e
--  trechos NÃO rejeitados (aprovados/pendentes/revisados).
-- ============================================================
create or replace function match_chunks(
  query_embedding   vector(1536),
  match_count       int default 8,
  similarity_threshold float default 0.2,
  filter_categories clinical_category[] default null,
  filter_source     uuid default null,
  only_approved     boolean default false
)
returns table (
  chunk_id     uuid,
  document_id  uuid,
  titulo       text,
  autor        text,
  pagina       int,
  category     clinical_category,
  content      text,
  similarity   real
) language sql stable as $$
  select c.id, d.id, d.titulo, d.autor, c.pagina, c.category, c.content,
         (1 - (c.embedding <=> query_embedding))::real as similarity
  from document_chunks c
  join documents d on d.id = c.document_id
  where c.embedding is not null
    and d.status = 'indexado'
    and c.status <> 'rejeitado'
    and (not only_approved or c.status = 'aprovado')
    and (filter_categories is null or c.category = any(filter_categories))
    and (filter_source is null or d.source_id = filter_source)
    and (1 - (c.embedding <=> query_embedding)) >= similarity_threshold
  order by c.embedding <=> query_embedding
  limit match_count;
$$;

-- ============================================================
--  RLS — uso interno. Habilitado; service_role (backend) ignora RLS.
--  Usuários autenticados leem; escrita de conteúdo via backend.
-- ============================================================
alter table users                 enable row level security;
alter table document_sources      enable row level security;
alter table documents             enable row level security;
alter table document_chunks       enable row level security;
alter table extracted_medications enable row level security;
alter table extracted_supplements enable row level security;
alter table extracted_conducts    enable row level security;
alter table extracted_protocols   enable row level security;
alter table clinical_cases        enable row level security;
alter table clinical_chat_messages enable row level security;
alter table rag_retrieval_logs    enable row level security;
alter table citations             enable row level security;
alter table review_queue          enable row level security;
alter table audit_logs            enable row level security;

-- Leitura para qualquer usuário autenticado (equipe interna)
do $$
declare t text;
begin
  foreach t in array array[
    'users','document_sources','documents','document_chunks',
    'extracted_medications','extracted_supplements','extracted_conducts','extracted_protocols',
    'clinical_cases','clinical_chat_messages','rag_retrieval_logs','citations','review_queue','audit_logs'
  ] loop
    execute format('drop policy if exists %I on %I;', t||'_read_auth', t);
    execute format('create policy %I on %I for select to authenticated using (true);', t||'_read_auth', t);
  end loop;
end $$;

-- Casos clínicos e mensagens: o autor pode inserir/editar os próprios
drop policy if exists cases_write_own on clinical_cases;
create policy cases_write_own on clinical_cases for all to authenticated
  using (created_by = auth.uid()) with check (created_by = auth.uid());
drop policy if exists msgs_write_own on clinical_chat_messages;
create policy msgs_write_own on clinical_chat_messages for all to authenticated
  using (created_by = auth.uid()) with check (created_by = auth.uid());

-- (Ingestão, extração e aprovação rodam no backend com a service_role key,
--  que ignora RLS. Revisores aprovam via endpoints com checagem de role.)
