-- Alta · Fase 1 · tabelas principais (seção 12 da especificação)
-- Tabelas das fases seguintes (checkins, competitor_analyses, knowledge_*) entram em migrações próprias.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------
create type plano_tipo   as enum ('alto_poder', 'start', 'master', 'admin');
create type status_tipo  as enum ('ativo', 'inativo');
create type canal_tipo   as enum ('web', 'whatsapp');
create type funcao_tipo  as enum ('conteudo', 'ideia', 'duvida', 'concorrencia', 'cadastro', 'gargalo', 'extra');
create type papel_tipo   as enum ('aluno', 'alta');
create type periodo_tipo as enum ('dia', 'semana', 'mes');

-- ---------------------------------------------------------------
-- users · também é a LISTA DE ACESSO (seção 10)
-- Só quem está aqui com status 'ativo' consegue entrar.
-- auth_id é preenchido no primeiro login.
-- ---------------------------------------------------------------
create table users (
  id                      uuid primary key default gen_random_uuid(),
  auth_id                 uuid unique references auth.users(id) on delete set null,
  nome                    text not null,
  email                   text unique,
  whatsapp                text unique,
  plano                   plano_tipo  not null default 'alto_poder',
  status                  status_tipo not null default 'ativo',
  data_entrada            date not null default current_date,
  acesso_ate              date,            -- programa: data_entrada + 12 meses; depois vira alto_poder
  consentimento_lgpd_em   timestamptz,     -- sem isto, nada do aluno é salvo
  primeiro_acesso         boolean not null default true,
  ultimo_acesso_em        timestamptz,
  criado_em               timestamptz not null default now(),
  constraint contato_obrigatorio check (email is not null or whatsapp is not null)
);
create index users_email_idx on users (lower(email));

-- ---------------------------------------------------------------
-- profiles · cadastro (seção 8.2)
-- ---------------------------------------------------------------
create table profiles (
  user_id               uuid primary key references users(id) on delete cascade,
  negocio               text,
  cliente_ideal         text,
  oferta                text,
  tom                   text,
  resumo_concorrencia   text,
  atualizado_em         timestamptz not null default now()
);

-- ---------------------------------------------------------------
-- diagnostics · Mapa do Gargalo (seção 9). Histórico: nunca sobrescreve.
-- ---------------------------------------------------------------
create table diagnostics (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references users(id) on delete cascade,
  respostas         jsonb not null,  -- 18 notas de 0 a 10 + objetivo
  notas_por_pilar   jsonb not null,  -- { "1": 6.3, ..., "6": 4.0 }
  gargalo_1         smallint not null check (gargalo_1 between 1 and 6),
  gargalo_2         smallint not null check (gargalo_2 between 1 and 6),
  objetivo          text,
  criado_em         timestamptz not null default now()
);
create index diagnostics_user_idx on diagnostics (user_id, criado_em desc);

-- ---------------------------------------------------------------
-- scoreboard · Placar (inicial agora; mensal na Fase 3)
-- Valores nulos = "não sei".
-- ---------------------------------------------------------------
create table scoreboard (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references users(id) on delete cascade,
  mes            date not null,          -- primeiro dia do mês de referência
  faturamento    numeric(12,2),
  lucro          numeric(12,2),
  ticket_medio   numeric(12,2),
  horas_semana   numeric(5,1),
  origem         text not null check (origem in ('inicial', 'mensal')),
  criado_em      timestamptz not null default now()
);
create index scoreboard_user_idx on scoreboard (user_id, mes);

-- ---------------------------------------------------------------
-- conversations e messages · histórico das funções
-- ---------------------------------------------------------------
create table conversations (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users(id) on delete cascade,
  canal       canal_tipo  not null default 'web',
  funcao      funcao_tipo not null,
  resumo      text,       -- resumo da conversa anterior (memória da F3)
  criado_em   timestamptz not null default now()
);
create index conversations_user_idx on conversations (user_id, funcao, criado_em desc);

create table messages (
  id                uuid primary key default gen_random_uuid(),
  conversation_id   uuid not null references conversations(id) on delete cascade,
  papel             papel_tipo not null,
  conteudo          text not null,
  tokens_entrada    integer,
  tokens_saida      integer,
  tokens_cache      integer,
  modelo            text,       -- 'simulado' quando ALTA_MODO_IA=simulado
  criado_em         timestamptz not null default now()
);
create index messages_conversa_idx on messages (conversation_id, criado_em);

-- ---------------------------------------------------------------
-- usage · contadores de uso por plano (seção 3)
-- Uma linha por aluno + função + tipo de período + início do período.
-- Resetar = começar uma linha nova no período seguinte (histórico preservado).
-- ---------------------------------------------------------------
create table usage (
  user_id          uuid not null references users(id) on delete cascade,
  funcao           funcao_tipo  not null,
  periodo          periodo_tipo not null,
  periodo_inicio   date not null,   -- dia / segunda-feira / dia 1, no fuso America/Sao_Paulo
  contador         integer not null default 0,
  primary key (user_id, funcao, periodo, periodo_inicio)
);

-- ---------------------------------------------------------------
-- settings · limites, horários e textos editáveis pelo admin
-- ---------------------------------------------------------------
create table settings (
  chave           text primary key,
  valor           jsonb not null,
  atualizado_em   timestamptz not null default now()
);

-- ---------------------------------------------------------------
-- leads_mentoria · quem respondeu MENTORIA
-- ---------------------------------------------------------------
create table leads_mentoria (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users(id) on delete cascade,
  origem      text not null default 'MENTORIA',
  criado_em   timestamptz not null default now()
);

-- ---------------------------------------------------------------
-- Segurança (RLS): cada aluno só lê os próprios dados.
-- Escritas e o painel admin passam pelo servidor (service role).
-- ---------------------------------------------------------------
alter table users          enable row level security;
alter table profiles       enable row level security;
alter table diagnostics    enable row level security;
alter table scoreboard     enable row level security;
alter table conversations  enable row level security;
alter table messages       enable row level security;
alter table usage          enable row level security;
alter table settings       enable row level security;
alter table leads_mentoria enable row level security;

create function meu_user_id() returns uuid
  language sql stable security definer set search_path = public as $$
  select id from users where auth_id = auth.uid()
$$;

create policy "aluno lê o próprio cadastro"   on users         for select using (auth_id = auth.uid());
create policy "aluno lê o próprio perfil"     on profiles      for select using (user_id = meu_user_id());
create policy "aluno lê os próprios gargalos" on diagnostics   for select using (user_id = meu_user_id());
create policy "aluno lê o próprio placar"     on scoreboard    for select using (user_id = meu_user_id());
create policy "aluno lê as próprias conversas" on conversations for select using (user_id = meu_user_id());
create policy "aluno lê as próprias mensagens" on messages     for select using (
  conversation_id in (select id from conversations where user_id = meu_user_id())
);
create policy "aluno lê o próprio uso"        on usage         for select using (user_id = meu_user_id());
-- settings e leads_mentoria: sem política = só o servidor acessa.


-- Alta · valores iniciais (seção 3). Editáveis depois no painel admin.
-- null = sem limite.

insert into settings (chave, valor) values
('limites', '{
  "alto_poder": { "conteudo": {"semana": 1},  "ideia": {"semana": 3},  "duvida": {"semana": 10}, "concorrencia": {"mes": 1}, "extras": false },
  "start":      { "conteudo": {"semana": 3},  "ideia": {"dia": 10},    "duvida": {"dia": 30},    "concorrencia": {"mes": 2}, "extras": true  },
  "master":     { "conteudo": {"semana": 3},  "ideia": {"dia": 10},    "duvida": {"dia": 30},    "concorrencia": {"mes": 4}, "extras": true  },
  "admin":      { "conteudo": null,           "ideia": null,           "duvida": null,           "concorrencia": null,       "extras": true  }
}'),
('horarios', '{
  "fuso": "America/Sao_Paulo",
  "reset_semanal": "segunda 00:00",
  "reset_mensal": "dia 1 00:00",
  "checkin": "segunda 09:00",
  "lembrete_checkin": "quarta",
  "placar_mensal": "dia 1"
}'),
('contato_growth4u', '{ "whatsapp": "" }')
on conflict (chave) do nothing;

-- Os textos fixos da seção 8 entram na tarefa 1.1.
