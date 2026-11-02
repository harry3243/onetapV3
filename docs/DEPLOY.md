# Deploying OneTap (one service + one database)

The backend also serves the built website, so you deploy ONE web service and ONE Postgres database. Same origin means login cookies just work.

## Render (recommended for a first launch)
1. Put the code on GitHub: unzip, `git init`, commit, push to a new private repo.
2. Create the database: Render dashboard > New > PostgreSQL. Use a paid plan for real users (the free one expires after 30 days). Copy its **Internal Database URL**.
3. Create the web service: New > Web Service > pick your repo.
   - Runtime: Node. Root directory: leave empty.
   - Build command: `cd frontend && npm install && npm run build && cd ../backend && npm install`
   - Start command: `cd backend && npm run migrate && npm start`
   - Health check path: `/healthz`
   - Instance type: **Starter (always on)**. The free type sleeps after 15 minutes, and sleeping stops the reminder scheduler.
4. Environment variables (Environment tab):
   - `NODE_ENV=production` (makes cookies Secure)
   - `DATABASE_URL` = the Internal Database URL
   - `JWT_SECRET` = a long random string (e.g. `openssl rand -hex 32`)
   - `APP_URL` and `API_URL` = your public URL, e.g. `https://onetap.onrender.com` (same value for both)
5. Deploy. Migrations run automatically at start and are safe to repeat. Do NOT seed: sample data has demo accounts with a known password (the seed command refuses in production).
6. Open the URL. Check `/healthz` shows `ok`, create an account, sign in, book.
7. Make yourself admin: in the database shell run `UPDATE users SET role='admin' WHERE email='you@example.com';`
8. Custom domain: Settings > Custom Domains, add the domain, set the DNS records Render shows, wait for HTTPS. Then update `APP_URL` and `API_URL` to the new address and redeploy.
9. Optional services (add the variables, redeploy): `RESEND_API_KEY` + `MAIL_FROM` (email), `TWILIO_*` (SMS, WhatsApp, voice), `GOOGLE_PLACES_API_KEY`, `GOOGLE_TRANSLATE_API_KEY`. Without them messages only appear in the logs.
10. Before real customers: set up uptime monitoring on `/healthz`, enable database backups on your plan, and get privacy-policy and consent wording reviewed.

## Other hosts
Railway, Fly.io or Google Cloud Run work the same way: one Node service with the same build and start commands plus any Postgres (Neon, Supabase, the host's own). If the database needs SSL, add `?sslmode=require` to `DATABASE_URL`.
