create table if not exists public.responses (
  id uuid primary key default gen_random_uuid(),
  request_id text,
  answer_type text not null,
  answer_text text not null,
  sender_name text,
  receiver_name text,
  question text,
  lang text,
  target text,
  created_at timestamptz not null default now()
);

alter table public.responses enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'responses'
      and policyname = 'allow_anon_insert_responses'
  ) then
    create policy "allow_anon_insert_responses"
    on public.responses
    for insert
    to anon
    with check (true);
  end if;
end
$$;
