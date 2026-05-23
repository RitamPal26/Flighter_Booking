# FlyingBird ✈️

Real-time flight booking app with interactive seat selection, multi-passenger booking, rescheduling, and PWA support.

Built with **Next.js 16**, **Supabase**, **Zustand**, **Tailwind CSS**, and **Shadcn UI**.

## Features

- **Search & Book** — Search flights by route, select seats on an interactive color-coded cabin map
- **Multi-Passenger** — Book up to 9 passengers in a single transaction
- **Real-Time Seats** — Supabase Realtime syncs seat availability across sessions; optimistic UI with rollback
- **Reschedule & Cancel** — Change flights or cancel bookings; enforced 2-hour cancellation window via DB trigger
- **PWA** — Service worker, offline fallback page, install-to-home-screen prompt
- **3D Globe** — Interactive globe showing flight routes (react-globe.gl)

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS 4 + Shadcn UI |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase SSR |
| State | Zustand (persisted) |
| PWA | Service Worker + Manifest |

## Local Setup

### 1. Prerequisites

- Node.js >= 20
- A Supabase project (free tier works)

### 2. Clone & Install

```bash
git clone <repo-url>
cd flight-app
npm install
```

### 3. Configure Supabase

Create a Supabase project at [supabase.com](https://supabase.com), then copy the `.env.example`:

```bash
cp .env.example
```

Fill in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

### 4. Run Migrations

Run the migration in the Supabase SQL editor (**SQL Editor > New Query**) or via the CLI:

```sql
-- Paste supabase/migrations/20260522_initial_schema.sql
```

This creates:
- `flights`, `seats`, `bookings`, `passengers`, `reschedules` tables
- Row-Level Security policies
- `book_seat` and `cancel_booking` RPC functions (atomic transactions)
- `enforce_cancellation_window` trigger (blocks cancel/reschedule within 2h of departure)

### 5. Seed Data

Run `supabase/seed.sql` in the SQL editor to populate:
- A test user
- 8 flights across 4 routes
- 120 seats per flight (first/business/economy classes)

**Test credentials:** `test@example.com` / `password123`

### 6. Run the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign in with the test account to start booking.

## Project Structure

```
src/
├── app/                    # Routes and Server Actions
│   ├── (auth)/signin, signup
│   ├── actions/bookingActions.ts   # Server Actions (booking, reschedule, cancel)
│   ├── bookings/                    # My Bookings page
│   └── offline/                     # PWA offline fallback
├── components/
│   ├── flights/           # Search form, flight list, 3D globe
│   ├── seats/             # Seat map with class zones
│   ├── checkout/          # Passenger details, payment, confirmation dialog
│   ├── shared/            # Navbar, reschedule dialog, confirm dialog, PWA
│   └── marketing/         # Landing page for unauthenticated users
├── lib/
│   ├── supabase/          # Client, server, middleware, queries, booking
│   └── services/          # Business logic (booking, payment)
├── store/                 # Zustand stores (flightStore, userStore)
└── types/                 # TypeScript interfaces
```

## Architecture Notes

- **Modular Monolith** — Code is organized by business domain (`flights`, `seats`, `checkout`, etc.) with strict boundaries
- **Action-Outcome** — Components never mutate the database; Server Actions handle all writes
- **Atomic Bookings** — `book_seat` RPC uses `SELECT ... FOR UPDATE` to prevent double-booking
- **State** — Zustand stores manage the multi-step booking flow; passenger passport numbers are redacted on persist
