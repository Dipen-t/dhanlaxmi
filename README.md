# Dhanlaxmi

Kitchen and catering management — orders, menus, vendors, payments, reports, PDF/WhatsApp.

Next.js 16 · PostgreSQL · Drizzle ORM

Production: [dhanlaxmi.nnsolutions.co.in](https://dhanlaxmi.nnsolutions.co.in)

---

## Local dev

```bash
npm install
cp .env.example .env
npm run dev
```

### Tablet / Termux PDFs

Menu and Kitchen PDFs use bundled fonts and prepared logo assets. They require no font downloads or native Sharp processing during generation. Deploy the `public/fonts/menu`, `public/menu-category-images`, `public/menu-themes` and `app/logo.png` assets along with the app. Standalone tracing includes the PDF assets; cPanel packing also copies `public`.

`node --import tsx scripts/check-menu-pdfs.ts` verifies generation with network access and Sharp deliberately disabled. `node --import tsx --test lib/reports/cash-position.test.ts` checks the cash-profit calculation. Refresh fonts/logos with `node scripts/prepare-pdf-assets.cjs` only on a development machine; the generated assets are already committed for deployments.

Event profit for now = client payments received − vendor payments linked to that order − other expenses linked to its client payments. Unpaid bill amounts and waived balances do not count as money received.

Expenses is the unified screen for outgoing money. Selecting an order shows the cash summary, vendor-wise paid totals and history, and other expenses. Vendor payments can be recorded before any client receipt; other expenses remain linked to a client receipt. The former `/payments` page redirects to `/expenses`, using the same existing ledger entries without a database migration.

### Database

```bash
npm run db:push
npm run db:migrate
npm run db:seed
npm run db:seed-menu
```

---

## Deploy to cPanel (simple)

```bash
npm run pack:cpanel
```

Upload **one file**: `dist/dhanlaxmi-cpanel.tar.gz`

1. **STOP** Node app in cPanel
2. Delete old files in app folder
3. **Extract** tarball in File Manager
4. Copy `.env.example` → `.env`
5. Startup: `server.js` → **RESTART once**

**Never** click Run NPM Install — it spawns 100+ processes on shared hosting.

If process limit hits 88–100/100: stop all Node apps, wait 10 min, then deploy.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development |
| `npm run pack:cpanel` | Build + create `dist/dhanlaxmi-cpanel.tar.gz` |
| `npm run build` | Production build only |
| `npm start` | Run locally after build |

---

## Environment

See `.env.example` for required variables (`DATABASE_URL`, WhatsApp API).
