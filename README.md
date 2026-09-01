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
