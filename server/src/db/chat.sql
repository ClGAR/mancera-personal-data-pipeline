-- Chat history and assistant memory tables for the AI Assistant.
-- Run this in Supabase SQL Editor if New Chat or Recent Chats report that
-- chat history tables are unavailable. It is safe to run more than once.

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

create table if not exists chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references profiles(user_id) on delete cascade,
  title text not null default 'New chat',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create table if not exists chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references chat_sessions(id) on delete cascade,
  user_id text not null references profiles(user_id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  mode text,
  source text,
  metadata jsonb not null default '{}'::jsonb,
  used_live_data boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists user_memories (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references profiles(user_id) on delete cascade,
  memory_type text not null check (memory_type in ('preference', 'correction', 'project_context', 'personal_context', 'learning_goal')),
  content text not null,
  confidence numeric(3, 2) not null default 0.70 check (confidence >= 0 and confidence <= 1),
  source_message_id uuid references chat_messages(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  is_active boolean not null default true
);

create table if not exists assistant_preferences (
  user_id text primary key references profiles(user_id) on delete cascade,
  memory_enabled boolean not null default true,
  preferred_tone text not null default 'warm, calm, practical',
  preferred_language_style text not null default 'clear and beginner-friendly',
  preferred_answer_length text not null default 'concise',
  preferred_explanation_level text not null default 'practical',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table chat_sessions add column if not exists archived_at timestamptz;
alter table chat_messages add column if not exists used_live_data boolean not null default false;

create index if not exists idx_chat_sessions_user_id_updated_at on chat_sessions(user_id, updated_at desc);
create index if not exists idx_chat_sessions_user_id_active_updated_at on chat_sessions(user_id, archived_at, updated_at desc);
create index if not exists idx_chat_messages_session_created_at on chat_messages(session_id, created_at);
create index if not exists idx_chat_messages_user_id_created_at on chat_messages(user_id, created_at desc);
create index if not exists idx_user_memories_user_id_active on user_memories(user_id, is_active, updated_at desc);

alter table chat_sessions enable row level security;
alter table chat_messages enable row level security;
alter table user_memories enable row level security;
alter table assistant_preferences enable row level security;

-- The Express backend uses the Supabase service role key and must keep it
-- server-only. These grants support service-role access without exposing chat
-- history directly to browser clients.
grant select, insert, update, delete on chat_sessions to service_role;
grant select, insert, update, delete on chat_messages to service_role;
grant select, insert, update, delete on user_memories to service_role;
grant select, insert, update, delete on assistant_preferences to service_role;
