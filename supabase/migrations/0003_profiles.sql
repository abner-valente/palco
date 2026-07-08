-- Tabela de perfis: uma linha por usuário, criada automaticamente no cadastro.
-- Útil para administração: buscar usuário por email, bloquear acesso, deixar notas.
create table if not exists public.profiles (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  email      text not null,
  full_name  text,
  created_at timestamptz not null default now(),
  blocked    boolean not null default false,
  notes      text
);

alter table public.profiles enable row level security;

-- Usuário só lê o próprio perfil.
create policy "profiles: usuario le o proprio perfil"
  on public.profiles for select
  using (auth.uid() = user_id);

-- Somente service_role escreve (admin via Supabase Studio ou Edge Function).
create policy "profiles: somente service role escreve"
  on public.profiles for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- Grants explícitos para evitar "permission denied" (mesmo padrão das subscriptions).
grant select on public.profiles to authenticated;
grant select, insert, update on public.profiles to service_role;

-- Trigger: cria automaticamente o perfil quando um usuário se cadastra.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (user_id, email)
  values (new.id, new.email)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
