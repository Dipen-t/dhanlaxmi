# Catering Demo — Product Specification

## Overview

A demo catering management application for tracking **raw materials**, **vendors**, and **orders**. The app should be polished, fully responsive, and deployment-ready.

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| ORM | Drizzle ORM (schema, migrations, type-safe queries) |
| Database | Neon Postgres (serverless) |
| Secrets | Environment variables (`.env` / `.env.local`) |

### Data layer notes

- **Neon** hosts the Postgres database.
- **Drizzle** defines the schema and handles all queries.
- Use the **direct** connection string from Neon for `DATABASE_URL` (migrations and app runtime).
- Keep `DATABASE_URL` in `.env` or `.env.local` — never commit it.

---

## Domain Model

### 1. Raw Materials

A fixed catalog of ingredients and food items. These are seeded into the database on first setup.

| # | Name |
|---|------|
| 1 | Paneer |
| 2 | Mushroom |
| 3 | Dahi |
| 4 | Babycorn |
| 5 | Juice |
| 6 | R/Y Simla/Gobi |
| 7 | Fruit |
| 8 | Soya Chaap |
| 9 | Mocktail |
| 10 | Brooklyn |
| 11 | Pani Puri |
| 12 | Oyster |
| 13 | Tikki Chat |
| 14 | Salary/Basil |
| 15 | Pasta |
| 16 | Pav |
| 17 | Dosa Coal |
| 18 | Cake Parlour |
| 19 | Delhi Chat |
| 20 | Strawberry.S |
| 21 | Pizza |
| 22 | Mango.S |
| 23 | G. Sandwich |
| 24 | Paan |
| 25 | Chinese |
| 26 | Ice Cream |
| 27 | Falooda |
| 28 | Gulab Jamun |

**Fields:** `id`, `name`, `vendorId` (nullable), `createdAt`

**Assignment rule (exclusive):** Each raw material can belong to **only one vendor**. If Vendor A is assigned Paneer and Mushroom, no other vendor can be assigned those materials. A material is either unassigned or owned by exactly one vendor.

---

### 2. Vendors

Suppliers that can be assigned multiple raw materials, with exclusive ownership per material.

| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID / auto-increment | Primary key |
| `name` | string | Required |
| `phone` | string | Required, validated format |
| `deliveryLocation` | enum | `venue` or `godown` — radio button in UI |
| `rawMaterials` | relation | One-to-many — a vendor has many materials; each material belongs to at most one vendor |
| `createdAt` | timestamp | Auto-set |
| `updatedAt` | timestamp | Auto-set on edit |

**UI behavior:**
- Create / edit vendor form with name, phone, multi-select for raw materials, and delivery-location radio group.
- Material picker shows only **unassigned** materials, plus materials already assigned to **this** vendor when editing.
- Materials assigned to other vendors are hidden or shown as disabled with the owning vendor's name.
- Saving a vendor updates `vendorId` on the selected materials and clears it from any materials removed from the selection.
- List view with search/filter by name or material.
- Empty state when no vendors exist.

---

### 3. Orders

Event catering orders.

| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID / auto-increment | Primary key |
| `orderId` | string | Human-readable order reference (e.g. `ORD-001`) |
| `date` | date | Event date |
| `venue` | string | Venue name or location |
| `numberOfPersons` | number | Positive integer |
| `mealType` | enum | `breakfast`, `lunch`, or `dinner` |
| `createdAt` | timestamp | Auto-set |
| `updatedAt` | timestamp | Auto-set on edit |

**UI behavior:**
- Create / edit order form with validation on all fields.
- List view sorted by date (newest first).
- Empty state when no orders exist.

---

## Suggested Drizzle Schema (reference)

```
raw_materials
  id, name, vendor_id (nullable, unique per material — FK to vendors)
  created_at

vendors
  id, name, phone, delivery_location, created_at, updated_at

orders
  id, order_id, date, venue, number_of_persons, meal_type, created_at, updated_at
```

Enforce exclusivity at the database level: `vendor_id` on `raw_materials` is nullable and references at most one vendor. No join table needed.

---

## App Sections / Routes

| Route | Purpose |
|-------|---------|
| `/` | Dashboard or landing with quick links |
| `/raw-materials` | Browse the material catalog; show assigned vendor or "Unassigned" |
| `/vendors` | List, create, and edit vendors |
| `/orders` | List, create, and edit orders |

Use a shared layout with responsive navigation (sidebar on desktop, drawer/hamburger on mobile).

---

## Core Requirements

### Responsive design (highest priority)

The site **must work well on every screen size**:

- Mobile phones (320px+)
- Tablets
- Laptops
- Desktop monitors
- Large displays

No horizontal overflow, no clipped content, no unusable touch targets on mobile.

### UI & UX

- Clean, modern interface
- Consistent color palette and typography
- Reusable UI components (buttons, inputs, cards, tables, modals)
- Loading states for async operations
- Empty states for lists with no data
- Accessible contrast ratios and visible focus states
- Smooth, subtle animations (no distracting motion)

### Performance

- Optimize images
- Lazy-load where appropriate
- Avoid unnecessary re-renders
- Keep the JavaScript bundle size reasonable

### Code quality

- TypeScript throughout
- Scalable folder structure (`app/`, `components/`, `db/`, `lib/`)
- Reusable components — no duplicated logic
- Environment variables for all secrets and config

### SEO

- Proper page titles per route
- Meta descriptions
- Semantic HTML (`main`, `nav`, `section`, headings)
- Open Graph metadata on key pages

---

## Environment Variables

```env
# Neon Postgres (direct connection string — use for app + migrations)
DATABASE_URL=postgresql://user:password@host.neon.tech/neondb?sslmode=require
```

Copy `.env.example` to `.env.local` (or `.env`) and paste your Neon connection string from the [Neon console](https://console.neon.tech).

**Scripts:**
- `npm run db:push` — apply schema to Neon
- `npm run db:generate` — generate SQL migration files
- `npm run db:migrate` — run migrations
- `npm run db:seed` — seed raw materials
- `npm run db:studio` — open Drizzle Studio

---

## Testing Checklist

Before marking the project complete, verify:

- [ ] Responsive on mobile, tablet, laptop, and desktop
- [ ] No layout breaking at common breakpoints
- [ ] No console errors in the browser
- [ ] No TypeScript or lint errors
- [ ] Vendor form validates name, phone, and material selection
- [ ] A raw material assigned to one vendor cannot be assigned to another
- [ ] Editing a vendor correctly releases removed materials (sets `vendorId` to null)
- [ ] Order form validates date, venue, headcount, and meal type
- [ ] Raw materials seed correctly on first run
- [ ] CRUD operations work for vendors and orders
- [ ] Navigation works on all devices
- [ ] Lighthouse performance is acceptable where practical

---

## Deliverable

A polished, responsive, maintainable catering demo that is ready to deploy. All three domains — raw materials, vendors, and orders — should be fully functional with persistent storage via Drizzle and Appwrite.
