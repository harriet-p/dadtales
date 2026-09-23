# Dad Tales

A single-purpose pipeline that emails Dad one memoir question per week, captures his reply (with photos), strips the quoted email thread, and exports everything for book layout.

**No login. No dashboard. Just send → capture → store → export.**

## Stack

| Piece | Choice |
|-------|--------|
| Runtime | Node.js + TypeScript |
| Database | Supabase (Postgres) |
| Photo storage | Supabase Storage (`answer-photos` bucket) |
| Email | Resend (outbound + inbound webhook) |
| Hosting | Vercel (cron + API routes) |

## How it works

```
┌─────────────┐     weekly cron      ┌──────────────┐
│  Supabase   │ ◄─────────────────── │ Vercel Cron  │
│  questions  │                      │ send-question│
└──────┬──────┘                      └──────┬───────┘
       │                                    │
       │                                    ▼
       │                             ┌──────────────┐
       │                             │    Resend    │
       │                             │  (outbound)  │
       │                             └──────┬───────┘
       │                                    │
       │                                    ▼
       │                                  Dad replies
       │                                    │
       │                                    ▼
       │                             ┌──────────────┐
       │                             │    Resend    │
       │                             │  (inbound)   │
       │                             └──────┬───────┘
       │                                    │ webhook
       │                                    ▼
       │                             ┌──────────────┐
       ├────────────────────────────►│  /api/inbound│
       │         store answer        │ quote-strip  │
       │         + photos            │ + upload     │
       ▼                             └──────────────┘
┌─────────────┐
│   answers   │ ◄──── /api/export or `npm run export`
└─────────────┘
```

## Setup

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Run the migration in **SQL Editor**:

   ```bash
   # contents of supabase/migrations/001_schema.sql
   ```

3. Create a **public** storage bucket named `answer-photos` (Dashboard → Storage → New bucket).
4. Copy **Project URL** and **service role key** (Settings → API).

### 2. Resend

1. Create an account at [resend.com](https://resend.com).
2. Add and verify your sending domain.
3. Enable **Inbound** on a domain or subdomain (e.g. `reply.yourdomain.com`) and point MX records per Resend docs.
4. Create an API key.
5. Add a webhook for `email.received` pointing to:

   ```
   https://your-app.vercel.app/api/inbound
   ```

6. Copy the webhook signing secret.

### 3. Environment variables

Copy `.env.example` to `.env` and fill in:

```bash
cp .env.example .env
```

| Variable | Purpose |
|----------|---------|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side DB + storage access |
| `RESEND_API_KEY` | Send + fetch inbound emails |
| `RESEND_WEBHOOK_SECRET` | Verify inbound webhook signatures |
| `FROM_EMAIL` | Sender, e.g. `questions@yourdomain.com` |
| `DAD_EMAIL` | Recipient for weekly questions |
| `CRON_SECRET` | Protects the cron route (Vercel sets this automatically in production) |
| `EXPORT_SECRET` | Token for the export endpoint |

Add the same variables in the Vercel project dashboard.

### 4. Install and seed

```bash
npm install
npm run seed
```

This loads 52 questions from `data/questions.json`. Edit that file before seeding if you want custom prompts — seed only runs when the table is empty.

### 5. Deploy to Vercel

```bash
npx vercel
```

The cron is configured in `vercel.json` to run **every Sunday at 1:00 UTC** (9:00 AM in UTC+8). Adjust the schedule there if needed.

## Local development

```bash
# Send the next unsent question manually (good for testing on your own email first)
npm run send

# Export to files
npm run export:json
npm run export:md

# Run quote-stripper tests
npm test
```

For inbound webhook testing locally, use a tunnel (ngrok, Cloudflare Tunnel) and point the Resend webhook at your tunnel URL + `/api/inbound`. Resend also has `resend emails receiving listen` for polling inbound mail during development.

## API routes

| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/api/cron/send-question` | GET/POST | `Authorization: Bearer $CRON_SECRET` | Send next question |
| `/api/inbound` | POST | Resend webhook signature | Process Dad's reply |
| `/api/export?secret=...&format=json` | GET | `EXPORT_SECRET` query param | Export all Q&A |

Export formats: `json` (default) or `markdown`.

Example:

```bash
curl "https://your-app.vercel.app/api/export?secret=YOUR_SECRET&format=markdown"
```

## Quote stripping

Replies are cleaned with `lib/quote-stripper.ts`, which handles common patterns from Gmail, Apple Mail, and Outlook:

- `On ... wrote:` blocks
- `-----Original Message-----`
- `>` quoted lines
- Outlook `From:/Sent:/To:` headers
- `Sent from my iPhone` signatures

Test early with real replies from different clients — this is the fiddliest part of reply-by-email.

## Customizing questions

Edit `data/questions.json`, then reset the `questions` table in Supabase and run `npm run seed` again. The file ships with 52 memoir-style prompts; swap any you don't like before the first seed.

## Export output

**JSON** — best for pulling into a design tool programmatically:

```json
{
  "entries": [
    {
      "question": "What was your childhood home like?",
      "answer_text": "We lived in a small brick house...",
      "photo_urls": ["https://..."],
      "date_answered": "2026-07-06T10:30:00.000Z"
    }
  ]
}
```

**Markdown** — quick human read-through:

```markdown
## What was your childhood home like?
*Answered July 6, 2026*

We lived in a small brick house...

![photo](https://...)
```

## Project structure

```
api/
  cron/send-question.ts   # Weekly send job
  inbound.ts              # Resend webhook handler
  export.ts               # JSON/Markdown export
lib/
  db.ts                   # Supabase queries
  email.ts                # Resend send + inbound fetch
  quote-stripper.ts       # Reply cleaning
  storage.ts              # Photo upload to Supabase
  export.ts               # Formatters
data/
  questions.json          # 52 seed prompts
scripts/
  seed.ts                 # Load questions into DB
  send-question.ts        # Manual send trigger
  export.ts               # Local export CLI
supabase/
  migrations/001_schema.sql
```

## Decisions made

- **Supabase over SQLite** — photo storage and hosted Postgres without extra services.
- **Resend** — single provider for outbound + inbound with a clean webhook model.
- **Secret-token export** — no auth UI; export is protected by `EXPORT_SECRET` only.
- **Most recent sent question** — inbound replies are linked to the latest `sent_at` question, which matches the weekly one-question-at-a-time flow.
