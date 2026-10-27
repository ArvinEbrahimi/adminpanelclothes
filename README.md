# پوشین | Admin panel demo (clothing store)

Frontend-only admin panel prototype. Persian (RTL), Next.js 16 + TypeScript + Tailwind v4.
There is no backend: `src/lib/store.ts` (Zustand + localStorage) simulates one, seeded with
realistic data from `src/lib/seed.ts`.

## Run

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build (Vercel-ready, no env vars needed)
```

## Pages

Dashboard, Orders (status workflow, manual order), Products (table/grid, bulk actions, editor),
Inventory (per-size stock), Customers (tiers), Coupons, Reports (CSV export), Settings (brand accent, reset demo).
Extras: Ctrl/⌘+K command palette, notifications, live order simulation, dark mode.

Demo login is pre-filled. Settings → "بازنشانی داده‌ها" restores the seed data.
