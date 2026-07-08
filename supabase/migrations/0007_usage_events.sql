-- Tabela de eventos de uso: rastreia ações dos usuários dentro do palco.
-- Eventos: sessao_inicio, sessao_fim, peca_criada, peca_removida,
--          conexao_feita, salvo, carregado.
create table if not exists public.usage_events (
  id        bigint generated always as identity primary key,
  user_id   uuid not null references auth.users (id) on delete cascade,
  evento    text not null,
  dados     jsonb,
  criado_em timestamptz not null default now()
);

alter table public.usage_events enable row level security;

-- Usuário autenticado pode inserir apenas os próprios eventos.
create policy "usage_events: usuario insere proprios eventos"
  on public.usage_events for insert
  with check (auth.uid() = user_id);

-- Somente service_role lê (administrador via Supabase Studio).
create policy "usage_events: somente service role le"
  on public.usage_events for select
  using (auth.role() = 'service_role');

grant insert on public.usage_events to authenticated;
grant select, insert, delete on public.usage_events to service_role;

create index usage_events_user_id_idx   on public.usage_events (user_id);
create index usage_events_criado_em_idx on public.usage_events (criado_em desc);

-- Limpeza automática: remove eventos com mais de 90 dias (roda às 3h30).
select cron.schedule(
  'limpar-usage-events-antigos',
  '30 3 * * *',
  $$
    delete from public.usage_events
    where criado_em < now() - interval '90 days';
  $$
);
