create extension if not exists pgcrypto;

create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  user_id text not null unique,
  github_id text unique,
  username text,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists github_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references profiles(user_id) on delete cascade,
  github_id text not null unique,
  username text not null,
  avatar_url text,
  access_token text,
  scope text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists repositories (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references profiles(user_id) on delete cascade,
  github_id text not null unique,
  repo_name text not null,
  full_name text not null,
  private boolean not null default false,
  html_url text,
  default_branch text,
  pushed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists commits (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references profiles(user_id) on delete cascade,
  repo_id uuid references repositories(id) on delete set null,
  repo_name text not null,
  commit_sha text not null unique,
  commit_message text,
  author_name text,
  committed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists sync_runs (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references profiles(user_id) on delete cascade,
  status text not null default 'running',
  repos_synced integer not null default 0,
  commits_synced integer not null default 0,
  error_message text,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_github_accounts_user_id on github_accounts(user_id);
create index if not exists idx_repositories_user_id on repositories(user_id);
create index if not exists idx_commits_user_id_committed_at on commits(user_id, committed_at desc);
create index if not exists idx_commits_repo_name on commits(repo_name);
create index if not exists idx_sync_runs_user_id_created_at on sync_runs(user_id, created_at desc);
