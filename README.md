# Volatile Solutions website

Astro / Nova website and creative portfolio. Use Node >=22.12, install dependencies with `npm ci`, then run `npm run dev`.

The public project inquiry wizard lives at `/start-a-project/`. The private inquiry workspace lives at `/admin/`; it uses Netlify Identity and Neon through server-side Netlify Functions.

See [INQUIRY_ADMIN_SETUP.md](INQUIRY_ADMIN_SETUP.md) for database migration, runtime secrets, invite-only/admin-role setup, local testing and deployment prerequisites. No live database or Identity account was configured by the foundation implementation.

The portfolio, migration source and Nova design rules remain documented in `CONTENT_MIGRATION_MAP.md`, `VOLATILE_CONTENT_SOURCE.md` and `AGENTS.md`.
