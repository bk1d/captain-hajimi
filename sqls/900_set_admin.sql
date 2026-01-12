insert into public.profiles (id, role)
select id, 'admin'
from auth.users
where email ilike 'YOUR_EMAIL@EXAMPLE.COM'
on conflict (id) do update
set role = 'admin';

select u.email, p.role
from auth.users u
join public.profiles p on u.id = p.id
where u.email ilike 'YOUR_EMAIL@EXAMPLE.COM';

