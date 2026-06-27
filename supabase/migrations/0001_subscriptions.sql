-- Tabela de assinaturas: uma linha por usuario, atualizada pelos webhooks do Stripe.
create table if not exists public.subscriptions (
  user_id uuid primary key references auth.users (id) on delete cascade,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  status text not null default 'inactive', -- active | past_due | canceled | inactive
  current_period_end timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

-- Usuario so pode ler a propria assinatura.
create policy "subscriptions: usuario le a propria linha"
  on public.subscriptions for select
  using (auth.uid() = user_id);

-- So o service role (usado pela Edge Function do webhook) pode escrever.
create policy "subscriptions: somente service role escreve"
  on public.subscriptions for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
