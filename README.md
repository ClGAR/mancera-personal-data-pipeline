# Personal Data Pipeline

Personal Data Pipeline is a portfolio-ready full-stack app that connects a user's GitHub account, syncs repository and commit activity, stores analytics in Supabase/Postgres, triggers optional n8n workflows, and lets the user ask an AI chatbot questions grounded in their own GitHub data.

## Why this is strong for interviews

This project demonstrates practical junior-dev skills with senior-level polish: OAuth login, REST API design, third-party API integration, relational modeling, scheduled jobs, webhook automation, AI prompt grounding, and a clean React dashboard. It is also intentionally built so the UI looks good immediately with mock data while the backend can be configured step by step.

## Tech stack

- Node.js and Express
- Passport.js GitHub OAuth2
- Supabase JS client with Postgres
- Axios for GitHub and webhook calls
- node-cron for hourly sync jobs
- Anthropic SDK/API for chatbot answers
- n8n webhook integration
- React and Vite
- Plain CSS

## Features

- GitHub OAuth routes for login, callback, current user, and logout
- GitHub repository and commit sync through the REST API
- Supabase schema for profiles, GitHub accounts, repositories, commits, and sync runs
- Hourly cron job that syncs stored GitHub accounts
- Optional n8n webhook call after sync completion
- AI chatbot endpoint that uses Supabase stats as grounding context
- Mock-first SaaS dashboard with KPI cards, chart, repo table, sync jobs, integrations, and chatbot panel
- Safe placeholder behavior when credentials are missing

## Folder structure

```text
.
├── package.json
├── README.md
├── .gitignore
├── .env.example
├── server
│   ├── package.json
│   └── src
│       ├── index.js
│       ├── app.js
│       ├── config
│       ├── routes
│       ├── services
│       ├── middleware
│       ├── jobs
│       └── db
└── web
    ├── package.json
    ├── index.html
    └── src
        ├── main.jsx
        ├── App.jsx
        ├── api.js
        ├── styles.css
        └── components
```

## Setup

```bash
npm install
npm run install:all
npm run dev
```

The web app runs on Vite at `http://localhost:5173`. The API runs at `http://localhost:4000`.

The app will start without real credentials. In that mode, the backend returns demo responses and setup guidance instead of crashing.

## Environment variables

Create a `.env` file from `.env.example` when you are ready to connect services.

```bash
cp .env.example .env
```

Important variables:

- `SESSION_SECRET`: a long random string for Express sessions
- `GITHUB_CLIENT_ID`: GitHub OAuth app client ID
- `GITHUB_CLIENT_SECRET`: GitHub OAuth app client secret
- `GITHUB_CALLBACK_URL`: usually `http://localhost:4000/auth/github/callback`
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_ANON_KEY`: public anon key
- `SUPABASE_SERVICE_ROLE_KEY`: server-only service role key
- `ANTHROPIC_API_KEY`: key for chatbot responses
- `N8N_WEBHOOK_URL`: optional webhook called after sync
- `VITE_API_BASE_URL`: frontend API URL

Never commit `.env` or any real secrets.

## Supabase setup

1. Create a Supabase project.
2. Open the SQL editor.
3. Run `server/src/db/schema.sql`.
4. Review `server/src/db/rls.sql`.
5. Enable RLS policies only after you decide how frontend users map to Supabase Auth or trusted JWT claims.
6. Add `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` to `.env`.

The Express server uses the service role key only on the backend. Do not expose it in React.

## GitHub OAuth setup

1. Go to GitHub Developer settings.
2. Create a new OAuth App.
3. Set Homepage URL to `http://localhost:5173`.
4. Set Authorization callback URL to `http://localhost:4000/auth/github/callback`.
5. Add the client ID and secret to `.env`.
6. Visit `http://localhost:4000/auth/github` or use the Connect GitHub button in the dashboard.

The OAuth scope is `read:user repo` so the sync service can read the authenticated user's repositories and commits.

## n8n webhook setup

1. Create an n8n workflow with a Webhook trigger.
2. Copy the production webhook URL.
3. Add it to `.env` as `N8N_WEBHOOK_URL`.
4. Run a sync. The backend posts user id, sync status, repos synced, commits synced, and timestamp.

If no webhook URL is configured, sync still succeeds and reports that webhook delivery was skipped.

## API endpoints

### Health

- `GET /health`

### Auth

- `GET /auth/github`
- `GET /auth/github/callback`
- `GET /auth/me`
- `POST /auth/logout`

### Stats

- `GET /stats/weekly`
- `GET /stats/top-repos`
- `POST /stats/sync`

### Sync

- `POST /sync/now`
- `GET /sync/runs`

### Chatbot

- `POST /chatbot/ask`

Example chatbot body:

```json
{
  "question": "What repository did I work on the most this week?"
}
```

## Roadmap

- Add API and component tests
- Add GitHub Actions CI
- Add Docker and docker-compose
- Add GitHub webhooks for push-triggered sync
- Encrypt stored GitHub tokens
- Move sync work to a BullMQ queue
- Deploy the web app and API
