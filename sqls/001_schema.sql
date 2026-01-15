create extension if not exists "uuid-ossp";

create table if not exists public.subscriptions (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  url text,
  content text,
  enabled boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint at_least_one_source check (url is not null or content is not null)
);

create table if not exists public.generated_configs (
  id uuid default uuid_generate_v4() primary key,
  token text not null unique,
  filename text not null,
  target text not null,
  params jsonb default '{}'::jsonb,
  name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.backend_urls (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  url text not null,
  enabled boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.remote_configs (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  url text not null,
  enabled boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

insert into storage.buckets (id, name, public) 
values ('configs', 'configs', true)
on conflict (id) do nothing;

drop policy if exists "Public Access" on storage.objects;
drop policy if exists "Allow Uploads" on storage.objects;
drop policy if exists "Allow Deletes" on storage.objects;

create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'configs' );

create policy "Allow Uploads"
  on storage.objects for insert
  with check ( bucket_id = 'configs' );
  
create policy "Allow Deletes"
  on storage.objects for delete
  using ( bucket_id = 'configs' );

