-- Habilita pg_cron para agendamento de tarefas no banco.
create extension if not exists pg_cron;

-- Limpeza automática diária às 3h (UTC): remove sessões com mais de 90 dias.
select cron.schedule(
  'limpar-sessions-antigas',
  '0 3 * * *',
  $$
    delete from public.sessions
    where logged_at < now() - interval '90 days';
  $$
);
