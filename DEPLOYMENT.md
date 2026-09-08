# Deployment guide — Vercel + Supabase + Prisma

This CRM uses **Next.js App Router**, **Supabase Auth**, and **Prisma** against **PostgreSQL (Supabase)**. Schema changes in this repo have been applied with `prisma db push` (there is **no** `prisma/migrations` history yet).

## Prerequisites

- GitHub account and a remote for this repo
- [Vercel](https://vercel.com) account
- Supabase project (same as local, or a dedicated **production** project)
- Values for all keys in [`.env.example`](.env.example)

## Build configuration (already in repo)

| Item | Value |
|------|--------|
| Install | `npm install` (runs `postinstall` → `prisma generate`) |
| Build | `prisma generate && next build` |
| Output | Next.js default (no custom `output` needed) |
| Framework | Next.js (auto-detected by Vercel) |

`prisma` and `@prisma/client` are in **dependencies** so Vercel can generate the client during install/build.

---

## Step 1 — Push code to GitHub

From the project root (after reviewing `git status`):

```bash
git add package.json .env.example DEPLOYMENT.md prisma/
# add any other app source files you intend to ship
git status
git commit -m "chore: prepare Vercel deploy (Prisma postinstall + env template)"
git push -u origin HEAD
```

Do **not** commit `.env` or `.env.local`. Confirm they stay ignored (see `.gitignore`).

---

## Step 2 — Import the project into Vercel

1. Open [Vercel Dashboard](https://vercel.com/dashboard) → **Add New…** → **Project**.
2. **Import** the GitHub repository for this CRM.
3. Framework Preset: **Next.js** (should auto-detect).
4. Root Directory: repository root (default).
5. Build & Development Settings (defaults are fine):
   - **Build Command:** `npm run build` (uses `prisma generate && next build`)
   - **Install Command:** `npm install`
   - **Output Directory:** leave empty (Next.js)
6. Do **not** deploy yet until environment variables are set (Step 3).

---

## Step 3 — Environment variables on Vercel

1. In the Vercel project: **Settings → Environment Variables**.
2. Add each key from `.env.example` (Production, and Preview if you use PR previews):

| Key | Notes |
|-----|--------|
| `DATABASE_URL` | Supabase **Transaction** pooler URL (`:6543`, include `?pgbouncer=true`) |
| `DIRECT_URL` | Supabase **Session** / direct URL (`:5432`) for Prisma |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<project-ref>.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon/public key from Supabase → **Project Settings → API** |

3. Use the **production** Supabase project credentials if you split prod from local/dev.
4. Save, then trigger a deploy (**Deployments → Redeploy**, or push a new commit).

### Finding Supabase connection strings

Supabase Dashboard → **Project Settings → Database → Connection string**:

- **Transaction** pooler → paste into `DATABASE_URL` (add `?pgbouncer=true` if not present).
- **Session** pooler or direct → paste into `DIRECT_URL`.

Replace `[YOUR-PASSWORD]` with the database password.

---

## Step 4 — Push database schema to Supabase Production

This project does **not** ship a migration folder yet. Sync schema with:

```bash
# Point env at PRODUCTION (or use a temporary .env.production.local — do not commit)
# Then:
npx prisma db push
```

Optional seed (demo products / fleet / drums — only if you want sample data on prod):

```bash
npm run db:seed
```

### If you later adopt migrations

```bash
npx prisma migrate dev --name init   # locally, once you decide to migrate
npx prisma migrate deploy            # on CI / before prod cutover
```

Until then, **`db push`** against the production `DIRECT_URL` / `DATABASE_URL` is the supported path.

### Auth / users on production

- Enable Email (or your chosen) auth providers in the **production** Supabase project.
- Ensure site URL / redirect URLs include your Vercel domain **and** password-recovery callback:
  - `https://your-app.vercel.app/**`
  - `https://your-app.vercel.app/dat-lai-mat-khau`
  - Local: `http://localhost:3020/dat-lai-mat-khau`
- Optional env: `NEXT_PUBLIC_SITE_URL=https://your-app.vercel.app` (used for reset-password email links).
- App users must exist in both Supabase Auth **and** the Prisma `User` table (email match) for role-aware features — create staff rows via register flow or seed.

**Demo quick-login accounts** (seeded into Prisma by `npm run db:seed`; password `123456`):

| Email | Prisma role |
|-------|-------------|
| `sales.anv@remixoil.vn` | `SALES` |
| `ketoan.btt@remixoil.vn` | `ACCOUNTANT` |
| `admin.thang@remixoil.vn` | `ADMIN` |

- Seed (`npm run db:seed`) upserts Prisma users **and** ensures Supabase Auth accounts (password `123456`): uses `SUPABASE_SERVICE_ROLE_KEY` if set, otherwise `signUp` via the anon key.
- Quick-login on `/login` only shows cards for demo emails that **already exist in Prisma**.

Private routes (`/dashboard`, `/khach-hang`, …) redirect to `/login` when unauthenticated.

---

## Verify after deploy

1. Open the Vercel deployment URL.
2. Hit `/login` — sign in with a production Supabase user.
3. Smoke-check: `/dashboard`, `/san-pham`, `/don-hang`, `/vo-phuy`.
4. If the build fails on Prisma: confirm `postinstall` / `prisma generate` logs and that `DATABASE_URL` / `DIRECT_URL` are set for the **Production** environment.

## Common issues

| Symptom | Fix |
|---------|-----|
| `Prisma Client not generated` | Ensure `postinstall` ran; rebuild. Keep `prisma` in dependencies. |
| `Can't reach database` / P1001 | Wrong host/password; use pooler URLs from Supabase. |
| Prepared statement / PgBouncer errors | `DATABASE_URL` must use pooler + `pgbouncer=true`; keep `DIRECT_URL` for migrate/push. |
| Auth redirect loop | Add Vercel URL to Supabase Auth redirect allow-list. |
| Empty tables on prod | Run `npx prisma db push` (and seed if desired) against prod. |

---

## Local production build check

```bash
npm run build
```

Should complete with exit code `0` before you rely on Vercel.
