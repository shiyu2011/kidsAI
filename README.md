# kidsAI

AI that builds thinkers, not answer-seekers. A safe AI learning coach for kids aged 8-12.

**Live:** https://kidsai-fawn.vercel.app

## What it does

- Kids chat with **SeanSean**, an AI buddy that rewards thinking effort
- Parents see a dashboard with effort metrics, trend charts, and conversation transcripts
- Admin dashboard for platform-wide monitoring (`/admin`)

## Tech stack

- **Frontend:** Next.js 16 (App Router, Turbopack)
- **AI:** OpenAI GPT-5.2 with SSE streaming
- **Database:** Prisma 7 + SQLite (dev) / Turso (prod)
- **Auth:** JWT via `jose` + `bcryptjs`
- **Hosting:** Vercel + Turso cloud

## Getting started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your keys

# Run database migration
npx prisma migrate dev

# Seed test accounts (optional)
npx tsx prisma/seed.ts

# Start dev server
npm run dev -- -H 0.0.0.0
```

## Environment variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | SQLite path (dev) or Turso URL (prod) |
| `DATABASE_AUTH_TOKEN` | Turso auth token (prod only) |
| `JWT_SECRET` | Secret for signing JWTs |
| `OPENAI_API_KEY` | OpenAI API key |
| `AI_MODEL` | Model name (default: `gpt-4o-mini`) |
| `ADMIN_EMAIL` | Admin account email (for seed script) |
| `ADMIN_PASSWORD` | Admin account password (for seed script) |

## Project structure

```
src/
  app/
    page.tsx          # Landing page
    login/            # Parent login
    signup/           # Parent signup
    dashboard/        # Parent dashboard (metrics, transcripts)
    admin/            # Admin dashboard (all parents/kids/usage)
    chat/[token]/     # Kid chat interface
    api/
      auth/           # Login, signup, me
      chat/           # AI chat with streaming (SSE)
      children/       # CRUD child profiles
      sessions/       # Create/list sessions (daily cap)
      dashboard/      # Stats endpoint
      admin/          # Admin overview endpoint
  lib/
    db.ts             # Prisma client singleton
    auth.ts           # JWT + password hashing
    auth-middleware.ts # Extract parent ID from request
    admin-middleware.ts # Admin-only route guard
    system-prompt.ts  # AI personality and behavior rules
    effort.ts         # Effort classification (lazy/trying/thinking/breakthrough)
    api-client.ts     # Frontend API helpers
```

## Safety features

- DB-based rate limiting (30 msgs/min per session)
- Daily session cap (10 sessions/day per parent)
- Max 20 turns per session
- Input validation and message length cap (2000 chars)
- Access tokens stripped from API responses
- `max_completion_tokens: 150` to control AI response length
