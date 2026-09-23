-- Dad Tales: questions + answers schema
-- send_order: week-by-week delivery sequence (shuffled mix of eras/tones)
-- theme / chronology_period: independent axes for browsing & book layout
-- bonus: true for the +10 buffer beyond the core 52

create table if not exists questions (
  id serial primary key,
  text text not null,
  send_order int not null unique,
  theme text not null,
  chronology_period text not null,
  bonus boolean not null default false,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists answers (
  id serial primary key,
  question_id int not null references questions(id) on delete cascade,
  body_text text not null,
  photo_urls text[] not null default '{}',
  received_at timestamptz not null default now()
);

create index if not exists idx_questions_send_order on questions (send_order);
create index if not exists idx_questions_sent_at on questions (sent_at);
create index if not exists idx_questions_theme on questions (theme);
create index if not exists idx_questions_chronology_period on questions (chronology_period);
create index if not exists idx_answers_question_id on answers (question_id);

-- Photo attachments (public read URLs for export / design tools)
insert into storage.buckets (id, name, public)
values ('answer-photos', 'answer-photos', true)
on conflict (id) do nothing;

-- Public read so export URLs work without signed tokens
drop policy if exists "Public read answer photos" on storage.objects;
create policy "Public read answer photos"
  on storage.objects
  for select
  using (bucket_id = 'answer-photos');

-- Uploads go through the service role key (bypasses RLS); this allows
-- authenticated clients if you ever add them later.
drop policy if exists "Service role upload answer photos" on storage.objects;
create policy "Service role upload answer photos"
  on storage.objects
  for insert
  with check (bucket_id = 'answer-photos');
