alter table public.requests
  add column if not exists relationship text,
  add column if not exists tone text,
  add column if not exists lang text,
  add column if not exists target text,
  add column if not exists memory_text text,
  add column if not exists sender_gender text,
  add column if not exists receiver_gender text,
  add column if not exists sender_wa text;
