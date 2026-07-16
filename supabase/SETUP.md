# Supabase setup — real-time admin dashboard

This is the one-time setup only *you* can do (it needs your own Supabase
account). Takes about 10 minutes.

## 1. Create the project

1. Go to https://supabase.com/dashboard and create a free account/project
   (any region close to the UK, e.g. `eu-west-2` London or `eu-central-1`).
2. Wait for provisioning to finish (~2 minutes).

## 2. Run the migration

1. In the project, open **SQL Editor** → **New query**.
2. Paste the entire contents of `supabase/migration.sql` (in this repo)
   and click **Run**.
3. This creates the `enquiries`, `push_subscriptions`, `rate_limits`, and
   `admins` tables, sets up Row Level Security so only your admin login
   can read enquiries, and turns on Realtime for the `enquiries` table.

## 3. Create your admin login

1. **Authentication** → **Users** → **Add user** → **Create new user**.
2. Use `info@blissfulblindsltd.co.uk` (or whichever email you want to
   sign into the dashboard with) and set a strong password. Tick
   **Auto Confirm User** so it doesn't need an email verification step.
3. If you used a *different* email than `info@blissfulblindsltd.co.uk`,
   go back to **SQL Editor** and run:
   ```sql
   insert into public.admins (email) values ('your-login-email@example.com')
     on conflict (email) do nothing;
   ```
   (The migration already inserted `info@blissfulblindsltd.co.uk` by
   default — only needed if you used something else.)

## 4. Get your API keys

**Project Settings** → **API**:
- `Project URL` → this is `SUPABASE_URL`
- `anon` `public` key → this is `SUPABASE_ANON_KEY`
- `service_role` `secret` key → this is `SUPABASE_SERVICE_ROLE_KEY`
  (**never** put this one in any client-side code — it's only used
  server-side in `api/_lib/supabase.js`)

## 5. Set environment variables in Vercel

Project → **Settings** → **Environment Variables** (Production, and
Preview if you want PR previews to work too):

| Variable | Value |
|---|---|
| `SUPABASE_URL` | from step 4 |
| `SUPABASE_ANON_KEY` | from step 4 |
| `SUPABASE_SERVICE_ROLE_KEY` | from step 4 |
| `VAPID_PUBLIC_KEY` | generate below |
| `VAPID_PRIVATE_KEY` | generate below (**secret** — never commit this to git) |
| `VAPID_SUBJECT` | `mailto:info@blissfulblindsltd.co.uk` |

A keypair was generated earlier in the Claude Code session that built
this (visible in that conversation's scroll-back, but deliberately not
written into this file or committed to git, since it's a private key).
Reuse those values, or generate a fresh pair yourself — either works,
it's just a keypair the browser and server use to recognize each other,
not tied to any account:
```bash
node -e "console.log(require('web-push').generateVAPIDKeys())"
```

Redeploy after saving (Vercel does this automatically on env var changes
in most cases, or trigger one manually from the Deployments tab).

## 6. Open the dashboard

Go to `https://www.blissfulblindsltd.co.uk/admin/`, sign in with the
email/password from step 3. Submit a test enquiry from the site in
another tab — it should appear instantly with a popup + sound, no
refresh needed.

Click the bell icon (top right) to enable browser push notifications —
your browser will ask for permission once.

## Adding a second admin later

```sql
insert into public.admins (email) values ('second-admin@example.com');
```

Then create that person a Supabase Auth user the same way as step 3.
No code changes needed.
