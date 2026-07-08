-- Tabela de alertas de anomalia de logins.
-- Populada automaticamente pelo pg_cron a cada hora.
-- Consulte via Supabase Studio > Table Editor > alerts.
create table if not exists public.alerts (
  id         bigint generated always as identity primary key,
  tipo       text not null,
  descricao  text not null,
  criado_em  timestamptz not null default now(),
  resolvido  boolean not null default false
);

alter table public.alerts enable row level security;

-- Somente service_role acessa (administrador via Supabase Studio).
create policy "alerts: somente service role"
  on public.alerts for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

grant select, insert, update on public.alerts to service_role;

-- Job horário: detecta padrões suspeitos na tabela sessions.
select cron.schedule(
  'verificar-anomalias-login',
  '0 * * * *',
  $$
    -- Usuário com mais de 10 logins na última hora
    insert into public.alerts (tipo, descricao)
    select
      'login_excessivo',
      'Usuario ' || email || ' fez ' || count(*) || ' logins na ultima hora'
    from public.sessions
    where logged_at > now() - interval '1 hour'
    group by email
    having count(*) > 10;

    -- Volume total acima de 50 logins na última hora
    insert into public.alerts (tipo, descricao)
    select
      'volume_alto',
      'Volume incomum: ' || count(*) || ' logins na ultima hora no total'
    from public.sessions
    where logged_at > now() - interval '1 hour'
    having count(*) > 50;
  $$
);
