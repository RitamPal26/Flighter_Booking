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
SUPABASE_PASSWORD=<your-db-password>
```

### 4. Run Migrations

Run all 3 migration files in order in the Supabase SQL editor (**SQL Editor > New Query**):

| Order | File |
|---|---|
| 1 | `supabase/migrations/20260522_initial_schema.sql` |
| 2 | `supabase/migrations/20260523_fix_reschedule_atomicity.sql` |
| 3 | `supabase/migrations/20260523_schema_qualify_functions.sql` |

This creates:
- `flights`, `seats`, `bookings`, `passengers`, `reschedules` tables
- Row-Level Security policies
- `book_seat`, `cancel_booking`, `reschedule_booking` RPC functions (atomic transactions)
- `enforce_cancellation_window` trigger (blocks cancel/reschedule within 2h of departure)

### 5. Seed Data

Run `supabase/seed.sql` in the SQL editor to populate:
- A test user account
- **29,344 flights** across all 56 city-to-city routes, 4 departure slots per day (00:00, 06:00, 12:00, 18:00 UTC)
- **~5.3 million seats** with per-aircraft-type row counts (A350=45 rows, B787=40, B737=30, A320=28)
- Flight numbers formatted as `FL-{ORIGIN}-{DESTINATION}-{3-digit-seq}` (e.g. `FL-CCU-DEL-001`)

> **Note:** The seed generates flights from **May 23 to July 30, 2026**. Date pickers in the app are constrained to this range automatically.

### 6. Run the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Testing Guide

### Test Account

| Field | Value |
|---|---|
| Email | `ritamjunior26@gmail.com` |
| Password | `12345678` |

---

### How to Book a Flight

| Step | What to do |
|---|---|
| **1** | Sign in with the test account |
| **2** | Select **Origin** and **Destination** from the dropdown (8 airports: CCU, DEL, JFK, LHR, DXB, BOM, SFO, NRT) |
| **3** | Pick a **Date** between May 23 – July 30, 2026 and set the number of passengers (1–9) |
| **4** | Click **Search Flights** — a list of 4 flights appears with different aircraft types and prices |
| **5** | Select a flight to open the seat map |
| **6** | Click one or more available seats on the color-coded cabin map (purple = first, sky = business, stone = economy). Selected seats turn green |
| **7** | Click **Continue** and fill in passenger details (name, passport, nationality, date of birth) for each seat |
| **8** | Review the booking summary and click **Pay** (mock payment — any card works) |
| **9** | The confirmation screen shows each ticket's PNR code, seat assignment, and price breakdown |

### Available Routes (8 cities, 56 directed pairs)

| | CCU | DEL | JFK | LHR | DXB | BOM | SFO | NRT |
|---|---|---|---|---|---|---|---|---|
| **CCU** | — | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **DEL** | ✓ | — | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **JFK** | ✓ | ✓ | — | ✓ | ✓ | ✓ | ✓ | ✓ |
| **LHR** | ✓ | ✓ | ✓ | — | ✓ | ✓ | ✓ | ✓ |
| **DXB** | ✓ | ✓ | ✓ | ✓ | — | ✓ | ✓ | ✓ |
| **BOM** | ✓ | ✓ | ✓ | ✓ | ✓ | — | ✓ | ✓ |
| **SFO** | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — | ✓ |
| **NRT** | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — |

### Daily Flight Slots

| Slot | Departure (UTC) | Aircraft |
|---|---|---|
| N | 00:00 | Airbus A350-900 |
| M | 06:00 | Boeing 737-800 |
| A | 12:00 | Airbus A320neo |
| E | 18:00 | Boeing 787 Dreamliner |

Each slot letter is part of the flight number: `FL-CCU-DEL-N-001`, `FL-CCU-DEL-M-002`, etc.

### Rescheduling & Cancellation

1. Go to **My Bookings** from the navbar
2. Click **Reschedule** or **Cancel** on any confirmed booking
3. Rescheduling opens a dialog to pick a new flight, seat, and review the price breakdown (includes $50 reschedule fee)
4. Cancellation prompts a confirmation dialog

> Both actions are blocked if the original flight departs within **2 hours** (enforced by a DB trigger).

---

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
