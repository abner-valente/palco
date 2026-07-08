-- Tabela de sessões: registra cada login de usuário.
-- Útil para acompanhar frequência de acesso e usuários ativos.
create table if not exists public.sessions (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references auth.users (id) on delete cascade,
  email      text not null,
  logged_at  timestamptz not null default now(),
  user_agent text
);

alter table public.sessions enable row level security;

-- Usuário só lê as próprias sessões.
create policy "sessions: usuario le as proprias linhas"
  on public.sessions for select
  using (auth.uid() = user_id);

-- Somente service_role escreve.
create policy "sessions: somente service role escreve"
  on public.sessions for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

grant select on public.sessions to authenticated;
grant select, insert, delete on public.sessions to service_role;

-- Índice para consultas por data (útil para limpeza e relatórios).
create index sessions_logged_at_idx on public.sessions (logged_at desc);
create index sessions_user_id_idx   on public.sessions (user_id);

-- Limpeza automática: remove sessões com mais de 90 dias.
-- Rode manualmente quando quiser ou configure um cron no Supabase.
-- delete from public.sessions where logged_at < now() - interval '90 days';
