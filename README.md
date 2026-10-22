# Family Budget

A private web app for household expenses, budgets and retirement planning, in USD and INR.
It installs on iPhone and Android as a home-screen app (PWA).

## What's here so far

- Household setup: the first person to open the app creates the household and becomes its admin.
- One login per family member. **Admins** see the whole household; **members** see only their own entries.
- USD and INR amounts are stored in their original currency, and reports convert everything to USD.
- The USD→INR rate is fetched once a day from a free public source (Frankfurter/ECB, falling back to open.er-api.com) and cached.
- Encryption: the database is encrypted at rest by the host (Neon), connections use TLS, and sensitive fields
  (account details, notes) are also encrypted in the app with AES-256-GCM (`src/lib/crypto.ts`).

- Expenses: manual entry and CSV import (US single Amount column or Indian Withdrawal/Deposit columns), with categories.
- Budgets per category per month in USD or INR (admins), and reports in USD (12-month trend, by category, by member).
- Accounts and net worth, plus a retirement planner covering 401(k), IRA, Roth IRA, HSA, EPF, PPF and NPS.

## Run locally

```bash
cp .env.example .env      # fill in DATABASE_URL, FIELD_ENCRYPTION_KEY, CRON_SECRET
npm install
npm run db:migrate
npm run dev               # http://localhost:3000
npm test
```

## Deploy (Vercel + Neon)

1. Create a free Postgres database at [neon.tech](https://neon.tech) and copy the pooled and direct connection strings.
2. Import this repo at [vercel.com/new](https://vercel.com/new).
3. Add the environment variables from `.env.example`. Generate `FIELD_ENCRYPTION_KEY` with `openssl rand -base64 32`
   and **keep a copy somewhere safe**: without it, encrypted fields can't be read.
4. Set the build command to `npm run db:deploy && npm run build`.
5. Open the site and create your household. The daily exchange-rate job is configured in `vercel.json`.

## Install on a phone

- **iPhone:** open the site in Safari, tap Share, then "Add to Home Screen".
- **Android:** open the site in Chrome, tap the menu, then "Install app".
