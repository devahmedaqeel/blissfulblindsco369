# Blissful Blinds Co 369 — Review System & Email Notifications

A standalone backend (API + database + admin panel) that powers two
things on the main site: the review widget on the homepage
(`#customer-reviews` section, `reviews-widget.js`/`reviews-widget.css`),
and site-wide email notifications (Nodemailer over Gmail SMTP) for every
form on the site — booking, the AI chatbot's lead form, and review
submissions.

**This folder is separate from the main static site**, and every change
made to the static site to wire these features up was additive:
`index.html`'s new review section/modal, one inline `BB_REVIEWS_API_BASE`
config line added to all 9 pages, and a small extension of `app.js`'s
*existing* booking-form handler (same validation, same success UI —
it now also POSTs to this backend). See "Email notifications" below for
exactly what changed and why.

## Why a separate backend at all?

The main site is deliberately a zero-build static site (see the project's
top-level `README.md`). A genuine review system — one where "126 reviews,
4.9/5" is a real, shared number and an admin can actually approve/reject
submissions — needs somewhere to store data and a place to log in. A
static site structurally cannot do either on its own, so this exists as
its own small Node.js service you deploy separately.

## Architecture

```
Browser (public widget) ──fetch──▶  GET/POST /api/reviews          (public)
Browser (admin panel)   ──fetch──▶  /api/admin/auth/*               (login)
                                     /api/admin/reviews/*            (JWT-protected)
                                            │
                                            ▼
                                   Express (server.js)
                                            │
                                            ▼
                                   SQLite (data/reviews.db)
                                   via Node's built-in node:sqlite
```

- **No native dependencies.** Uses Node's built-in `node:sqlite` module
  (stable from Node 22.5+, still flagged experimental by Node itself as of
  this writing) instead of `better-sqlite3`/`sqlite3`, so there's nothing
  to compile — it runs anywhere a modern Node runs, with no build step.
- **Admin auth is a Bearer JWT**, not a cookie — the admin panel stores it
  in `sessionStorage` and sends it explicitly on every request. This means
  there's no ambient browser-attached credential for a malicious page to
  ride along on, which is what makes CSRF protection unnecessary here
  (there's nothing to forge).
- **The public review API and the admin API are on different CORS
  policies.** `/api/reviews` allows cross-origin calls from whatever
  domains you list in `CORS_ORIGINS` (the static site's real domain). The
  admin API has no CORS layer at all — it's same-origin only, served by
  this same process, at `/admin/`.

## Setup

```bash
cd review-system
npm install
cp .env.example .env      # then edit .env — see below
node src/db/seed.js       # seeds the 4 real testimonials already on the site
node src/db/createAdmin.js <username> <password>   # create your admin login
npm start                 # or: npm run dev  (auto-restarts on file changes)
```

The server prints the admin panel URL on startup (`/admin/`).

### Required `.env` values

| Variable | What it's for |
|---|---|
| `PORT` | Port the API listens on (default `4000`). |
| `CORS_ORIGINS` | Comma-separated list of origins allowed to call `/api/reviews` from a browser. Must include your real site domain, e.g. `https://blissfulblindsco369.com`. |
| `JWT_SECRET` | Long random string signing admin sessions. Generate one with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`. The server refuses to start in production without this set to something long. |
| `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile secret key — see below. Leave blank locally; the server will warn loudly and skip bot verification rather than block you during development. |

### Connecting the live site to this backend

In `index.html`, right before `reviews-widget.js` loads:

```html
<script>window.BB_REVIEWS_API_BASE = 'http://localhost:4000/api';</script>
```

**Change this to wherever you deploy this backend** (e.g.
`https://reviews-api.blissfulblindsco369.com/api`). Also add that same
static site domain to `CORS_ORIGINS` in the backend's `.env`, or the
browser will block the requests.

### Setting up Cloudflare Turnstile (bot protection)

1. Go to the [Cloudflare Turnstile dashboard](https://dash.cloudflare.com/?to=/:account/turnstile) and create a free widget for your domain.
2. Copy the **Site Key** into `index.html`, replacing `YOUR_TURNSTILE_SITE_KEY` on the `#nrTurnstileWrap` element's `data-sitekey` attribute (and remove the `hidden` attribute next to it so the widget actually renders).
3. Copy the **Secret Key** into `TURNSTILE_SECRET_KEY` in `.env`.

Without step 2/3, the form still works (submissions just aren't
bot-checked) — the honeypot field and rate limiting still apply
regardless, but they're a weaker line of defense on their own. Don't ship
to production without a real Turnstile key configured.

## Admin panel

`/admin/` — sign in with the account you created via `createAdmin.js`.
There is deliberately no default admin account baked into the system.

To reset a password later, just re-run:
```bash
node src/db/createAdmin.js <same-username> <new-password>
```

Dashboard supports: search, filter by status/star rating, sort, approve,
reject, delete, edit (name/rating/text), and toggle "featured" (only on
approved reviews — featured reviews sort first on the public widget and
get a gold ribbon).

## Email notifications

Every form submission on the site — the booking form (all 9 pages), the
AI chatbot's lead-capture form, and review submissions — triggers two
emails via Nodemailer over Gmail SMTP:

1. **Admin notification** → `EMAIL_ADMIN_TO` (defaults to
   `blissfulblindsco369@gmail.com`). Branded HTML email with a data table
   of everything submitted, plus "Call Customer" / "Reply by Email"
   buttons, and `Reply-To` set to the customer's address so replying in
   your inbox goes straight to them.
2. **Customer confirmation** → the address they submitted. Matches the
   business's exact requested copy ("Thank You for Contacting Blissful
   Blinds Co…"); review submissions get a slightly different
   "awaiting approval" version instead, since that's factually what
   happens to a review.

### Setting up real Gmail delivery

1. Turn on 2-Step Verification: https://myaccount.google.com/security
2. Generate an App Password (NOT your normal Gmail password): https://myaccount.google.com/apppasswords
3. Set in `.env`:
   ```
   EMAIL_USER=blissfulblindsco369@gmail.com
   EMAIL_PASS=<the 16-character app password>
   ```

Until `EMAIL_PASS` is set, the server automatically falls back to
Nodemailer's Ethereal test SMTP service (a real, free, temporary inbox
built for exactly this) and logs a preview URL for every email it sends
— the whole pipeline works and is fully testable before you have real
Gmail credentials, it just doesn't reach a real inbox yet.

### What's saved regardless of email outcome

Every booking/chatbot-lead submission is saved to the `leads` table
*before* any email is attempted, so a Gmail/SMTP hiccup never means a
submission is lost — `admin_email_sent`/`customer_email_sent` columns
record whether each one actually went out, for troubleshooting.

### How the static site connects to this

`window.BB_REVIEWS_API_BASE` (set inline near the bottom of every page)
points at this backend's `/api`. `app.js`'s existing booking-form
handler — same validation and success message as before — now also
`fetch()`s `${BB_REVIEWS_API_BASE}/notify` after validation passes. It's
fire-and-forget: the existing instant success transition is unchanged,
and if delivery fails, a small fallback note ("call us if you don't
hear back") is appended to the success message already on screen. The
chatbot's lead form (`chatbot.js`) does the same, but shows a distinct
fallback message with call/WhatsApp links, since that's a more
immediate, conversational moment.

### A pre-existing bug fixed along the way

`window-blinds-range/index.html` had a different, older booking form
(different field IDs, posting to a third-party Formspree endpoint, and
missing the `#formSuccess` element the shared `app.js` handler needs) —
inconsistent with the identical form used on the other 8 pages. It's now
been brought in line with those 8 (same field IDs, same success element,
two missing required fields — "Best Time To Call" / "How Did You Hear
About Us" — added using that page's own existing visual style) so all 9
booking forms behave identically and share the same code path.

## Deployment

This is a normal Node.js process — deploy it anywhere that runs Node
22.5+: a small VPS with `pm2`/`systemd` to keep it alive, or a platform
like Render/Railway/Fly.io. Put it behind HTTPS (a reverse proxy like
Caddy/Nginx, or the platform's built-in TLS) — the server sets
`Strict-Transport-Security` in production but can't terminate TLS itself.

The SQLite file lives at `data/reviews.db`. Back it up regularly — it's
the entire database. `data/` is gitignored on purpose; don't commit it.

## Security measures implemented

- **SQL injection**: every query is a parameterized/prepared statement —
  user input is never concatenated into SQL text. Verified with direct
  injection attempts (`' OR '1'='1`, `'; DROP TABLE reviews;--`) against
  both the public and admin search paths.
- **XSS**: the frontend (both the public widget and the admin panel) only
  ever writes user-supplied text via `textContent`, never `innerHTML`.
  The server additionally strips `<...>` tag characters server-side as a
  second layer, so stored data is clean even if a future UI change
  introduced an `innerHTML` by mistake.
- **CSRF**: not applicable — admin auth is a Bearer token sent explicitly
  by JS, not a cookie the browser attaches automatically.
- **Rate limiting**: 5 review submissions / 15 min / IP, 10 admin login
  attempts / 15 min / IP, 120 public reads / min / IP (all configurable
  via `.env`).
- **Bot protection**: honeypot field (silently discards submissions that
  fill in a field real users never see) + Cloudflare Turnstile, verified
  server-side (a client can't fake having passed a client-side widget).
- **Auth**: bcrypt (cost 12) password hashing, constant-time-ish login
  (a dummy hash is checked even for unknown usernames so response timing
  doesn't reveal whether an account exists), JWT with expiry.
- **PII**: the public API never returns email addresses — only the admin
  API does, and only to an authenticated admin.
- **Headers**: CSP, X-Frame-Options, X-Content-Type-Options,
  Referrer-Policy, Permissions-Policy set on every response; HSTS in
  production.
- **Body size limit**: JSON bodies capped at 20kb to blunt payload-based
  DoS attempts.

### Known tradeoffs (deliberate, documented rather than hidden)

- **Turnstile fails open, not closed.** If `TURNSTILE_SECRET_KEY` isn't
  set, submissions are still accepted (with a loud server-side warning)
  rather than the form breaking entirely. This was chosen so a site
  operator can launch the review form before finishing Turnstile setup,
  at the cost of weaker spam protection in that window. Rate limiting +
  honeypot still apply regardless.
- **No profile picture upload.** The brief listed this as optional.
  Reviews instead get a generated initials avatar (name-derived, client
  side, zero attack surface). Real file upload was deliberately skipped —
  it's a meaningful extra security surface (file-type spoofing, storage
  limits, path handling) for an optional feature; if wanted later, the
  `avatar_url` column already exists in the schema to support it.
- **Review schema.org markup is injected client-side** (after the widget
  fetches real approved reviews), because the main site has no
  server-side rendering step. Search engines that execute JavaScript when
  indexing (Google does) will see it; crawlers that don't render JS
  won't. This mirrors how the rest of the review content is delivered on
  this static site — there's no way around it without adding a build/SSR
  step to the whole site, which was explicitly out of scope.

## API reference

### Public

- `GET /api/reviews?page=&limit=&rating=&featured=` — approved reviews +
  live `{ average, total }` stats.
- `POST /api/reviews` — submit a new review (`name`, `email`, `rating`,
  `review`, `website` [honeypot, leave empty], `turnstileToken`). Always
  goes in as `pending`. Also sends the admin + customer emails described
  above.
- `POST /api/notify` — generic form-submission endpoint used by the
  booking form and the chatbot's lead form. Body: `source` (`"booking"`
  or `"chatbot-lead"`), `name`, `email`, `phone`, `postcode?`, `service?`,
  `appointmentDate?`, `appointmentTime?`, `message?`, `website` [honeypot].
  Saves to the `leads` table, then sends the admin + customer emails.

### Admin (require `Authorization: Bearer <token>`)

- `POST /api/admin/auth/login` — `{ username, password }` → `{ token }`.
- `GET /api/admin/auth/me` — validates the current token.
- `GET /api/admin/reviews?status=&rating=&search=&sort=&page=&limit=`
- `GET /api/admin/reviews/summary` — counts for the dashboard header.
- `PATCH /api/admin/reviews/:id/status` — `{ status: "approved"|"rejected"|"pending" }`
- `PATCH /api/admin/reviews/:id/featured` — `{ featured: true|false }` (only approved reviews can be featured)
- `PUT /api/admin/reviews/:id` — edit `{ name?, rating?, review? }`
- `DELETE /api/admin/reviews/:id`

## Database schema

```
reviews (id, name, email, rating 1-5, review, avatar_url, submitted_at,
         updated_at, status [pending|approved|rejected], featured 0/1,
         ip_hash)
admin_users (id, username, password_hash, created_at)
leads (id, source, name, email, phone, postcode, service, appointment_date,
       appointment_time, message, submitted_at, ip_hash,
       admin_email_sent 0/1, customer_email_sent 0/1)
```

Seeded data: the 4 real testimonials already published on the homepage's
existing testimonials carousel (Charlotte C., Claire Germain, Irene
McLaughlin, Sue Sharp) — see `src/db/seed.js` for exact source notes,
including why their email/date fields are marked as legacy imports rather
than fabricated.
