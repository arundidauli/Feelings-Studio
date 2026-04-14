do $$
begin
  if exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'requests'
      and policyname = 'allow_anon_select_requests'
  ) then
    drop policy "allow_anon_select_requests" on public.requests;
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'requests'
      and policyname = 'allow_header_based_select_requests'
  ) then
    create policy "allow_header_based_select_requests"
    on public.requests
    for select
    to anon
    using (
      sender_token = ((current_setting('request.headers', true))::json ->> 'x-sender-token')
      or request_id = ((current_setting('request.headers', true))::json ->> 'x-request-id')
    );
  end if;
end
$$;
