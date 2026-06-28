-- O service_role precisa de GRANT explicito na tabela, alem das policies de RLS,
-- senao a Edge Function recebe "permission denied for table subscriptions" (42501)
-- mesmo a policy estando correta.
grant select, insert, update on public.subscriptions to service_role;
grant select on public.subscriptions to authenticated;
