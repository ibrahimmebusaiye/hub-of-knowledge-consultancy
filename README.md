# Hub of Knowledge & Enlightenment Consultancy Firm

Production-oriented website, contact management system and privacy-conscious first-party analytics dashboard.

## Architecture

- Existing public HTML pages are served unchanged from `public/`.
- Next.js App Router provides the protected `/admin` application and REST API.
- PostgreSQL stores administrator sessions, contact messages and anonymous analytics events.
- Prisma owns the schema and SQL migrations.
- Resend delivers contact notifications using its HTTPS API.
- Vercel hosts the static pages and Node.js functions; Neon is the recommended PostgreSQL Marketplace provider.

The admin dashboard reports unique visitors, sessions, page views, enquiries, acquisition sources, countries, devices and UTM campaign conversions. Reporting is displayed in `Africa/Freetown`; database timestamps remain UTC.

## Local setup

Requirements: Node.js 20.19 or newer and PostgreSQL.

1. Copy `.env.example` to `.env.local` and fill in the values.
2. Install dependencies with `npm install`.
3. Apply migrations with `npm run db:deploy`.
4. Start the site with `npm run dev`.
5. Visit `/admin/setup` and use `ADMIN_SETUP_TOKEN` to create the initial owner.
6. Remove `ADMIN_SETUP_TOKEN` from the production environment after setup succeeds.

For environments with an interactive shell, the first owner can alternatively be created without sending a setup token over HTTP:

`npm run admin:create -- --email=admin@example.com`

`RESEND_API_KEY` and `CONTACT_FROM_EMAIL` may remain empty for local interface development. Production contact notifications require both values and a verified sender domain.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Pooled PostgreSQL URL, preferably supplied by the Neon Vercel integration |
| `NEXT_PUBLIC_APP_URL` | Canonical public origin |
| `ALLOWED_ORIGINS` | Comma-separated origins allowed to make browser mutations |
| `ADMIN_SETUP_TOKEN` | Temporary one-time owner bootstrap secret |
| `RESEND_API_KEY` | Resend API credential |
| `CONTACT_NOTIFICATION_EMAIL` | Address receiving new enquiry notifications |
| `CONTACT_FROM_EMAIL` | Verified email sender |
| `CRON_SECRET` | Secret Vercel supplies to scheduled maintenance requests |

Never commit `.env` or `.env.local`.

## Deployment on Vercel

1. Import the GitHub repository into Vercel.
2. Add a Neon Postgres integration from the Vercel Marketplace and use its pooled URL for `DATABASE_URL`.
3. configure all variables from `.env.example` in the Production environment.
4. Run `npm run db:deploy` against the production database.
5. Deploy, create the owner at `/admin/setup`, then remove `ADMIN_SETUP_TOKEN`.
6. Connect the production domain and update `NEXT_PUBLIC_APP_URL` and `ALLOWED_ORIGINS`.

`vercel.json` schedules daily cleanup of expired sessions/rate-limit buckets and retries failed contact-notification emails.

## Analytics definitions and privacy

- **Page view:** a tracked public page load.
- **Session:** one browser-tab browsing session.
- **Unique visitor:** an anonymous first-party browser identifier observed in the selected range.
- **Conversion:** a contact submission associated with an analytics session.

The system does not store visitor IP addresses. Vercel's country header is converted to an approximate country and the request IP is discarded. The tracker honors Global Privacy Control and Do Not Track. WhatsApp and some apps remove referrers, so UTM-tagged links are required for reliable campaign attribution.

The company should publish an analytics/privacy notice appropriate to the jurisdictions in which it operates before production launch.

## Quality checks

- `npm run typecheck`
- `npm test`
- `npm run build`

The OpenAPI 3.1 document is available at `/api/openapi`.
