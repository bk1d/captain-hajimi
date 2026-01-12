alter table public.subscriptions enable row level security;
alter table public.backend_urls enable row level security;
alter table public.remote_configs enable row level security;
alter table public.generated_configs enable row level security;

alter table public.subscriptions add column if not exists user_id uuid references auth.users(id) default auth.uid();
alter table public.backend_urls add column if not exists user_id uuid references auth.users(id) default auth.uid();
alter table public.remote_configs add column if not exists user_id uuid references auth.users(id) default auth.uid();
alter table public.generated_configs add column if not exists user_id uuid references auth.users(id) default auth.uid();

create table if not exists public.profiles (
  id uuid not null references auth.users(id) on delete cascade primary key,
  role text not null check (role in ('admin', 'user')) default 'user',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;

create table if not exists public.system_settings (
  key text not null primary key,
  value text not null
);

alter table public.system_settings enable row level security;

create or replace function public.is_admin()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  return exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
end;
$$;

drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Admins can view all profiles" on public.profiles;
drop policy if exists "Admins can update profiles" on public.profiles;

create policy "Users can view own profile"
  on public.profiles for select
  using ( auth.uid() = id );

create policy "Admins can view all profiles"
  on public.profiles for select
  using ( public.is_admin() );

create policy "Admins can update profiles"
  on public.profiles for update
  using ( public.is_admin() );

drop policy if exists "Everyone can read system settings" on public.system_settings;
drop policy if exists "Admins can insert system settings" on public.system_settings;
drop policy if exists "Admins can update system settings" on public.system_settings;

create policy "Everyone can read system settings"
  on public.system_settings for select
  using ( true );

create policy "Admins can insert system settings"
  on public.system_settings for insert
  with check ( public.is_admin() );

create policy "Admins can update system settings"
  on public.system_settings for update
  using ( public.is_admin() );

insert into public.system_settings (key, value)
values ('registration_enabled', 'true')
on conflict (key) do nothing;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  is_first_user boolean;
begin
  select count(*) = 0 into is_first_user from public.profiles;

  insert into public.profiles (id, role)
  values (new.id, case when is_first_user then 'admin' else 'user' end)
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

drop policy if exists "Users manage own subscriptions" on public.subscriptions;
drop policy if exists "Users manage own backend_urls" on public.backend_urls;
drop policy if exists "Users manage own remote_configs" on public.remote_configs;
drop policy if exists "Users manage own generated_configs" on public.generated_configs;

create policy "Users manage own subscriptions"
  on public.subscriptions for all
  using ( auth.uid() = user_id )
  with check ( auth.uid() = user_id );

create policy "Users manage own backend_urls"
  on public.backend_urls for all
  using ( auth.uid() = user_id )
  with check ( auth.uid() = user_id );

create policy "Users manage own remote_configs"
  on public.remote_configs for all
  using ( auth.uid() = user_id )
  with check ( auth.uid() = user_id );

create policy "Users manage own generated_configs"
  on public.generated_configs for all
  using ( auth.uid() = user_id )
  with check ( auth.uid() = user_id );

