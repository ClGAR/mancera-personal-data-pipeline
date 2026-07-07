-- These examples show the policies you should enable before exposing tables to
-- browser clients. The Express API uses the Supabase service role key on the
-- server, which bypasses RLS and must never be shipped to the frontend.

alter table profiles enable row level security;
alter table github_accounts enable row level security;
alter table repositories enable row level security;
alter table commits enable row level security;
alter table sync_runs enable row level security;

-- This project stores app user ids like "github:12345". If you later connect
-- Supabase Auth, replace these examples with policies that compare user_id to
-- auth.uid() or to a trusted JWT claim.

create policy "Profiles are readable by owner"
on profiles for select
using (user_id = current_setting('request.jwt.claims', true)::jsonb ->> 'user_id');

create policy "GitHub accounts are readable by owner"
on github_accounts for select
using (user_id = current_setting('request.jwt.claims', true)::jsonb ->> 'user_id');

create policy "Repositories are readable by owner"
on repositories for select
using (user_id = current_setting('request.jwt.claims', true)::jsonb ->> 'user_id');

create policy "Commits are readable by owner"
on commits for select
using (user_id = current_setting('request.jwt.claims', true)::jsonb ->> 'user_id');

create policy "Sync runs are readable by owner"
on sync_runs for select
using (user_id = current_setting('request.jwt.claims', true)::jsonb ->> 'user_id');

-- In production, writes should go through the Express API or trusted edge
-- functions. Keep insert/update/delete policies locked down unless you have a
-- specific client-side write path.
