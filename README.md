# Personal Data Pipeline

## Overview

Personal Data Pipeline is a full-stack developer analytics app that connects to GitHub, syncs repository and commit activity, stores the data in Supabase/Postgres, and displays the results in a modern React dashboard.

The app also includes a local AI Assistant powered by Ollama. It can answer grounded questions about the user's synced GitHub data, or route general software development, productivity, learning, and project questions to local Ollama.

## Why I built this

I built this project to demonstrate practical full-stack development skills in a realistic product-style application. It combines authentication, data syncing, database modeling, automation, analytics, and AI integration into one connected workflow.

This project demonstrates:

- OAuth authentication
- REST API design
- Third-party API integration
- Database design
- Supabase/Postgres
- Scheduled background jobs
- Webhook automation
- Local AI chatbot integration
- Frontend dashboard design

## Tech Stack

### Frontend

- React
- Vite
- CSS
- lucide-react

### Backend

- Node.js
- Express
- Passport.js GitHub OAuth
- Supabase JS
- Axios
- node-cron
- Ollama local AI

### Database

- Supabase/Postgres
- Row Level Security examples

### Automation

- n8n webhook integration

## Features

- GitHub OAuth login
- GitHub repository and commit sync
- Live dashboard stats
- Weekly commit analytics
- Top repositories table
- Real sync history logs
- Manual sync button
- Hourly cron sync
- Optional n8n webhook notification
- Local AI Assistant using Ollama
- Automatic routing between GitHub data answers and general AI help
- Supabase fallback answers if AI is unavailable
- Clean modern dashboard UI

## Frontend Functionality

The dashboard UI is wired to feel like a real app rather than a static mockup:

- Working sidebar navigation with hash-based page state
- Live Sync Now action that refreshes weekly stats, top repositories, and sync history
- Searchable and filterable repository table
- Real sync history filters for status and date ranges
- Functional AI Assistant with hidden Auto Mode and answer source badges
- Integration configuration modals with honest configured, not configured, local only, and coming soon states
- Settings interactions with session/localStorage persistence where backend endpoints do not exist yet
- Export data action that downloads a JSON snapshot of currently loaded user, stats, repository, and sync data
- Toast notifications for sync, logout, copy, export, save, and backend-offline states
- Polished loading, empty, and error states across the dashboard

Current limitations are intentionally visible in the UI:

- Settings persistence is local or localStorage only unless backend settings endpoints are added later.
- Email and Slack notifications are coming soon.
- GitHub disconnect has a confirmation modal, but the backend disconnect endpoint is not implemented yet.

## AI Assistant

The AI Assistant uses Auto Mode by default. It detects whether a question should use app-provided context, synced GitHub data, or general software development help.

- The assistant opens with a personalized greeting and suggested starter prompts while Auto Mode stays behind the scenes.
- Authenticated chat sessions are saved in Supabase so the current conversation can be restored after refresh.
- Simple date and time questions are answered from app-provided context using the configured backend timezone.
- GitHub-related questions are answered from synced Supabase/GitHub data such as repositories, commits, weekly stats, and sync history.
- General development questions use the local Ollama model for broader help, interview prep, README writing, project ideas, and explanations.
- Answer source badges show whether a response came from app context, GitHub data, general Ollama AI, saved memory, or synced-data fallback.

Ollama is the current free local setup and does not require a paid Anthropic API key. General AI answers are not guaranteed to be grounded in the user's GitHub data unless Auto Mode detects that the question should use synced GitHub data.

## AI Assistant Memory

Authenticated users can enable assistant memory from Settings. Memory helps the assistant remember durable preferences, corrections, and project context across chats.

Memory is stored in Supabase through backend-only API routes:

- `chat_sessions` stores recent chat threads.
- `chat_messages` stores user and assistant messages for session restore and short-term context.
- `user_memories` stores active long-term memories such as preferences, corrections, project context, and learning goals.
- `assistant_preferences` stores assistant settings such as whether memory is enabled.

The assistant uses lightweight backend rules to save durable memories after a response. It avoids intentionally storing secrets, API keys, tokens, passwords, service role keys, OAuth secrets, and webhook URLs. This is a portfolio implementation and should still be reviewed before production use.

Users can delete one saved memory, clear all saved memories, or turn memory off. Turning memory off stops new long-term memories from being written, while regular authenticated chat sessions can still be saved.

## AI Assistant Behavior

Auto Mode defaults to general help unless the user clearly asks about their synced GitHub data. This keeps normal questions like `what is GHL`, `explain OAuth 2.0`, or `can I air fry a hotdog?` from being over-routed into GitHub analytics.

The assistant style is designed to be warm, calm, concise, practical, beginner-friendly, and honest when unsure. It acknowledges corrections, uses saved memories only when relevant, and avoids repeating memory back unless the user asks.

Manual QA prompts for Auto Mode:

- `what is GHL` should answer as a general AI/business automation question and explain GoHighLevel as the likely meaning.
- `Remember that GHL means GoHighLevel in my AI automation context.` followed later by `what does GHL mean again?` should use saved memory.
- `explain OAuth 2.0` should answer generally without requiring GitHub auth.
- `2+2` should return `2 + 2 = 4.` from app calculation.
- `what day is it today` should return the app/server date.
- `which repository had the most commits?` should use GitHub Data mode when authenticated.
- After logout, `which repository had the most commits?` should show the friendly Connect GitHub message.

## Theme Support

The frontend supports a production-style theme system:

- Light mode
- Dark mode
- System preference mode
- Theme preference saved locally in `localStorage`
- System mode follows the browser or OS `prefers-color-scheme` setting
- Implemented with CSS variables and a lightweight React theme context

The saved localStorage key is:

```text
personal-data-pipeline-theme
```

## Screenshots

### Overview Dashboard

![Overview Dashboard](docs/screenshots/overview.png)

### Weekly Stats

![Weekly Stats](docs/screenshots/weekly-stats.png)

### Top Repositories

![Top Repositories](docs/screenshots/top-repositories.png)

### Sync History

![Sync History](docs/screenshots/sync-history.png)

### Chatbot

![Chatbot](docs/screenshots/chatbot.png)

### Integrations

![Integrations](docs/screenshots/integrations.png)

### Settings

![Settings](docs/screenshots/settings.png)

## Folder Structure

```text
.
|-- server/
|   |-- src/
|   |   |-- routes/       Express route handlers
|   |   |-- services/     GitHub, Supabase, sync, chatbot, and webhook logic
|   |   |-- db/           Supabase schema and RLS SQL files
|   |   |-- config/       Environment, Passport, and Supabase setup
|   |   |-- middleware/   Auth and error handling middleware
|   |   `-- jobs/         Scheduled sync jobs
|   `-- package.json
|-- web/
|   |-- src/
|   |   |-- pages/        Dashboard pages
|   |   |-- components/   Reusable UI components
|   |   |-- data/         Data shaping and mock fallback data
|   |   `-- api.js        Frontend API client
|   `-- package.json
|-- package.json
`-- README.md
```

Key folders:

- `server/` contains the Express API, GitHub OAuth flow, Supabase integration, sync jobs, and AI chatbot backend.
- `web/` contains the React/Vite dashboard.
- `server/src/routes` defines API endpoints.
- `server/src/services` contains business logic for syncing, analytics, webhooks, and chatbot responses.
- `server/src/db` contains the Supabase schema and Row Level Security examples.
- `web/src/pages` contains the main dashboard screens.
- `web/src/components` contains shared UI components.

## Environment Variables

Real secrets must be stored in:

```text
server/.env
```

Do not place backend secrets in `web/.env` or commit them to Git.

Expected `server/.env` variables:

```env
NODE_ENV=
PORT=
CLIENT_URL=
APP_TIMEZONE=
SESSION_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_CALLBACK_URL=
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
AI_PROVIDER=
OLLAMA_BASE_URL=
OLLAMA_MODEL=
N8N_WEBHOOK_URL=
```

`N8N_WEBHOOK_URL` is optional and non-blocking. Sync still works if the webhook is not configured.

Anthropic support may still exist as an optional or legacy provider, but the current free local setup uses Ollama:

```env
AI_PROVIDER=ollama
```

## Local Setup

Install dependencies from the root:

```bash
npm install
npm run install:all
```

Start the backend:

```bash
cd server
npm run dev
```

Start the frontend in a second terminal:

```bash
cd web
npm run dev
```

Backend:

```text
http://localhost:4000
```

Frontend:

```text
http://localhost:5173
```

## GitHub OAuth Setup

1. Create a GitHub OAuth App in GitHub Developer Settings.
2. Set the Homepage URL:

```text
http://localhost:5173
```

3. Set the callback URL:

```text
http://localhost:4000/auth/github/callback
```

4. Add the GitHub client ID and client secret to `server/.env`.
5. Start the backend and frontend.
6. Log in through the dashboard or visit:

```text
http://localhost:4000/auth/github
```

## Supabase Setup

1. Create a Supabase project.
2. Open the Supabase SQL editor.
3. Run:

```text
server/src/db/schema.sql
```

4. Review and run the RLS examples if needed:

```text
server/src/db/rls.sql
```

5. Add the Supabase project URL, anon key, and service role key to `server/.env`.

The Express backend uses the service role key server-side only. It should never be exposed to the frontend.

## Ollama Setup

Ollama powers the local AI Assistant for the free development setup.

1. Install Ollama.
2. Pull the local model:

```bash
ollama pull llama3.2
```

3. Confirm Ollama is running:

```text
http://127.0.0.1:11434
```

4. Add this to `server/.env`:

```env
APP_TIMEZONE=Asia/Manila
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=llama3.2
```

The AI Assistant uses Auto Mode by default. Simple date/time questions use app-provided backend context, GitHub-data questions call the local Ollama API with synced Supabase data and fall back to Supabase-based answers if the AI model is unavailable, and general questions call Ollama directly for broad assistant responses.

## API Endpoints

```text
GET  /health
GET  /auth/github
GET  /auth/github/callback
GET  /auth/me
POST /auth/logout
POST /stats/sync
GET  /stats/weekly
GET  /stats/top-repos
GET  /stats/sync-history
POST /chatbot/ask
GET  /chatbot/sessions
POST /chatbot/sessions
GET  /chatbot/sessions/:id/messages
DELETE /chatbot/sessions/:id
GET  /chatbot/memories
POST /chatbot/memories
PATCH /chatbot/preferences
DELETE /chatbot/memories/:id
DELETE /chatbot/memories
```

Example chatbot request body:

```json
{
  "question": "Which repository had the most commits?",
  "mode": "auto",
  "sessionId": "optional-chat-session-id",
  "memoryEnabled": true
}
```

## Security Notes

- Never commit `server/.env`.
- OAuth tokens should be encrypted before production use.
- The Supabase service role key must stay backend-only.
- The n8n webhook URL should be treated as sensitive.
- Rotate exposed local development keys before making the repository public.
- This project includes security-minded structure and RLS examples, but it is not claiming production-ready security yet.

## Roadmap

- Add tests
- Add GitHub Actions CI
- Dockerize app
- Deploy frontend and backend
- Replace polling with GitHub webhooks
- Add BullMQ queue for retries
- Encrypt stored OAuth tokens
- Improve RLS policies
- Add more advanced AI summaries
