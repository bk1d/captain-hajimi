alter table public.subscriptions add column if not exists content text;
alter table public.subscriptions alter column url drop not null;
alter table public.subscriptions drop constraint if exists at_least_one_source;
alter table public.subscriptions add constraint at_least_one_source check (url is not null or content is not null);
