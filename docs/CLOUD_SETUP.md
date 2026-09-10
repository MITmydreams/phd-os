# Cloud sync setup (Supabase)

Edit on the **website** from your phone, iPad, or any computer — everyone sees the same latest data.

## 1. Create a free Supabase project

1. Open [https://supabase.com](https://supabase.com) and sign in
2. **New project** → pick a name (e.g. `phd-os`) → set a database password → create
3. Wait until the project is ready

## 2. Create the table

In Supabase: **SQL → New query** → paste → **Run**:

```sql
create table if not exists public.phd_os_state (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

-- Server uses the service role key only (via /api/data).
-- Lock the table down for anon/authenticated clients:
alter table public.phd_os_state enable row level security;
```

No rows needed yet — the first save from the app creates them.

## 3. Copy API keys

Supabase → **Project Settings → API**:

| Name | Use as env var |
|------|----------------|
| Project URL | `NEXT_PUBLIC_SUPABASE_URL` |
| `service_role` (secret) | `SUPABASE_SERVICE_ROLE_KEY` |

Never put the `service_role` key in client-side code or GitHub. Only in Vercel / `.env.local`.

## 4. Add env vars on Vercel

1. [Vercel Dashboard](https://vercel.com) → your **phd-os** project → **Settings → Environment Variables**
2. Add both variables for **Production** (and Preview if you want)
3. **Deployments → … on latest → Redeploy** (required so the new env vars load)

Or with CLI (after `npx vercel login`):

```bash
npx vercel env add NEXT_PUBLIC_SUPABASE_URL production
npx vercel env add SUPABASE_SERVICE_ROLE_KEY production
npx vercel --prod
```

## 5. (Optional) Local Mac also uses the same cloud

Create `/Users/wangwangjue/Desktop/Apply/.env.local` (gitignored):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_secret
```

Then restart local server / re-run `npm run start:autostart` so Mac, phone, and iPad share one database.

## 6. First sync

1. Open your Vercel URL on your laptop
2. Edit anything (or **Settings → Import backup JSON** from `data/user-data.json` / a download)
3. Wait ~1s for “Saved to cloud”
4. Open the **same URL** on iPhone/iPad — you should see the same data

## How it works

```text
Phone / iPad / Laptop
        │
        ▼
   Vercel website
        │
   /api/data  (GET / PUT)
        │
        ▼
   Supabase (phd_os_state)
```

Browser `localStorage` is only a fast cache. **Cloud is the source of truth.**

## Notes

- Last write wins if two devices edit at the exact same time
- Still useful: **Settings → Download backup JSON** occasionally
- GitHub stays for **code**; your live notebook lives in Supabase
