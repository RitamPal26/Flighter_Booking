# FlyingBird Agent Development Guidelines

This document serves as the ground truth for agents developing, maintaining, or refactoring the **FlyingBird** application.

## 1. Architectural Philosophy: The Modular Monolith

FlyingBird is built as a **Modular Monolith**. We prioritize domain-driven separation while maintaining the ease of a unified repository.

* **Domain Isolation**: Code is organized by business capability (e.g., `flights`, `seats`, `marketing`, `auth`).
* **Strict Boundaries**: Modules communicate through defined service layers, not direct database access.
* **Unified Deployment**: The entire application is deployed as a single unit, avoiding the complexity of microservices while retaining their organizational benefits.

## 2. Core Tech Stack

* **Framework**: Next.js 16 (App Router + Turbopack).
* **Styling**: Tailwind CSS + Shadcn UI.
* **Database/Auth**: Supabase (PostgreSQL) + Supabase SSR.
* **State Management**: Zustand (lightweight, domain-specific stores).
* **Language**: TypeScript (Strict mode).

## 3. Directory Structure & Conventions

We follow a strictly controlled file structure to ensure modularity.

```text
src/
├── app/              # Routes and Pages (Next.js 16 conventions)
│   ├── (auth)/       # Auth-specific route group
│   ├── actions/      # Server Actions (Transaction controller)
│   └── ...
├── components/       # Domain-specific components
│   ├── flights/      # Flight logic and UI
│   ├── seats/        # Seat selection and management
│   ├── checkout/     # Payment and Confirmation
│   └── shared/       # Reusable atoms (Navbar, etc.)
├── lib/              # Infrastructure and services
│   ├── supabase/     # Supabase client/middleware/queries
│   └── services/     # Business logic layer (booking, payments)
├── store/            # Zustand stores
└── utils/            # Pure helper functions

```

## 4. Coding Principles

### A. The "Action-Outcome" Pattern

* **Logic placement**: Never perform database mutations in components. Use **Server Actions** (`'use server'`) or `src/lib/services`.
* **Validation**: Validate all `FormData` inputs on the server before processing.

### B. Supabase SSR Guidelines

* **Server Client**: Always use the provided `src/lib/supabase/server.ts`. Remember that `cookies()` is asynchronous in Next.js 16.
* **Client Client**: Use `src/lib/supabase/client.ts`. Ensure environment variables are correctly injected with the `NEXT_PUBLIC_` prefix.

### C. State Management

* **Global vs Local**: Use Zustand only for cross-component shared state (e.g., `FlightStore`). If data is confined to a single route or feature, prefer `useState` or `useReducer`.

### D. Security & Performance

* **Dynamic Imports**: Use `next/dynamic` for heavy client-side components (like the 3D Globe) to prevent SSR errors and improve initial page load speed.
* **Middleware**: Use `src/middleware.ts` to protect routes. Never allow unauthenticated users to access `app/bookings` or payment endpoints.

## 5. Development Workflow

1. **New Features**: Create the service layer first, then the Server Action, then the UI component.
2. **Database Changes**: Always update the `supabase/migrations/` folder before manually running queries. Use `seed.sql` for test data population.
3. **PWA**: The application is configured as a PWA via `public/manifest.json`. Maintain `next-pwa` settings in `next.config.ts`.

## 6. Rules for Agents

1. **Read `next-pwa` and Supabase SSR docs** if you encounter environment-specific errors.
2. **Never break atomicity**: Booking a flight is a transaction. Always use Supabase RPCs or combined transactions in services.
3. **Respect the domain**: Do not leak flight logic into the marketing components or vice versa.
4. **Style Consistency**: Always use Shadcn UI components over raw HTML elements to maintain theme consistency.

## 7. Completed Feature Implementations

### Task 01 — Search & Booking
- **PassengerDetailsForm** (`src/components/checkout/PassengerDetailsForm.tsx`): Full passenger details form with name, passport number, nationality (dropdown), and date of birth. Shown at the `passenger_details` step. Saves to `flightStore.passengerData`.
- **Booking flow updated**: `FlightDashboard` now renders `PassengerDetailsForm` at the `passenger_details` step, `CheckoutDialog` at `confirmation` (pre-payment), and `ConfirmationView` (post-payment).
- **ConfirmationView upgraded**: Displays PNR code, seat assignment (number + class), passenger name, and a price breakdown showing base fare + seat upgrade fee.
- **CheckoutDialog updated**: Shows passenger data summary with redacted passport number. Stores full booking result in `flightStore.bookingResult`.

### Task 02 — Seat Selection
- **Class zone section dividers**: `SeatMap` splits seats by class (first/business/economy) into separate visual zones with colored headers ("First Class · Rows 1–3", etc.).
- **Row labels**: Each row shows its row number on the left side within the grid.
- **Color coding**: First = purple-200, Business = sky-200, Economy = stone-100, with matching section header colors and legend.

### Task 03 — Rescheduling & Cancellation
- **`rescheduleBooking` fixed**: Now properly cancels the old booking, creates a new booking on the new flight/seat, charges a $50 reschedule fee, and records the reschedule in the `reschedules` table.
- **`cancelBooking` action**: New server action wrapping `cancelBookingTransaction` RPC.
- **`BookingsClient`** (`src/app/bookings/BookingsClient.tsx`): Client component with cancel button, loading state, and confirmation dialog.
- **`ConfirmDialog`** (`src/components/shared/ConfirmDialog.tsx`): Reusable confirmation modal using the existing `Dialog` component, supports loading state and destructive variant.

### Task 04 — Zustand Stores
- **`bookingResult` in `flightStore`**: Stores `{ bookingId, pnrCode, seatNumber, seatClass, totalPrice }` after successful booking for display in `ConfirmationView`.
- **`cachedBookings` in `userStore`**: Array of `CachedBooking` objects persisted alongside session token.
- **`logout()` now resets booking state**: Calls `useFlightStore.getState().resetBooking()` to clear flight selection on logout.
- **Optimistic seat selection**: `SeatMap` sets `pendingSeatId` on click (yellow pulse), finalizes after 400ms. Realtime subscription rolls back if the seat becomes unavailable.

### Task 05 — PWA
- **`public/manifest.json`**: Full PWA manifest with `standalone` display, blue theme color, icon references.
- **`public/icons/`**: SVG app icons (192x192 and 512x512) with blue "F" logo.
- **`public/sw.js`**: Service worker with app shell caching and offline fallback to `/offline`.
- **`src/app/offline/page.tsx`**: Offline fallback page with "You're Offline" message.
- **`InstallPrompt`** (`src/components/shared/InstallPrompt.tsx`): Handles `beforeinstallprompt` event, shows install banner at bottom of screen.
- **`ServiceWorkerRegister`** (`src/components/shared/ServiceWorkerRegister.tsx`): Registers `sw.js` on mount.
- **`layout.tsx`**: Updated metadata (title, description, manifest, apple-web-app), separate `viewport` export with `themeColor`.
- **`next.config.ts`**: Added `Cache-Control` headers for `sw.js`.

### Infrastructure fixes
- **`middleware.ts`**: Fixed auth route paths from `/login` to `/signin`.
- **`src/lib/supabase/booking.ts`**: Fixed RPC call from non-existent `create_booking_transaction` to `book_seat` with required params.

### Task 06 — Multi-Passenger Booking
- **`flightStore.ts`**: Changed state shape to plural arrays — `selectedSeatId` → `selectedSeatIds: string[]`, `passengerData` → `passengersData: PassengerDetails[]`, `bookingResult` → `bookingResults: BookingResult[]`. `toggleSeatSelection` adds/removes from array without auto-advancing step.
- **`SeatMap.tsx`**: Allows selecting multiple seats up to `searchQuery.passengers` count. Clicking an unselected seat beyond the limit is ignored. Shows "N of M seats selected" counter and "Continue" button. Realtime rollback removes only the contested seat.
- **`PassengerDetailsForm.tsx`**: Renders N bordered form sections (one per selected seat) with name, passport, nationality, DOB. All submitted at once.
- **`CheckoutDialog.tsx`**: Lists all passengers (redacted passport), all seats with upgrade fees. Total = base × N + sum of extra fees. Calls `processMultiBooking`.
- **`bookingActions.ts`**: New `processMultiBooking` takes flight + array of `SeatInfo`, processes payment once, creates one booking per seat via `book_seat` RPC, returns array of results.
- **`ConfirmationView.tsx`**: Shows each ticket in its own card with PNR, passenger name, seat, fare, and aggregated price breakdown.
- **`SearchForm` already stored `passengers` count** in `searchQuery` — used as the max seat selection limit.

### Task 07 — Reschedule Enhancements
- **`queries.ts`**: Added `searchFlightsByDate(origin, destination)` to filter flights by route using `ilike`. Date filtering is done in JS in the dialog to avoid potential Supabase timezone/date-range comparison issues.
- **`RescheduleDialog.tsx`**: Upgraded with date picker, route-specific flight search, full color-coded seat map (section headers, legend, aisle gaps, row numbers), and a confirmation step showing flight summary + price breakdown (base fare + seat upgrade + $50 reschedule fee + amount due).
- **`RescheduleDialog` flight filtering**: Filters out any new flights departing within 2 hours, so users can only pick eligible replacement flights.
- **`enforce_cancellation_window` DB trigger**: Blocks cancellation/rescheduling of bookings whose original flight departs within 2 hours. Error is caught in the UI and displayed as a clear toast message rather than a raw database error.

### Task 08 — Hydration Fix & Booking Date Display
- **`formatters.ts`**: Fixed `formatTime` hydration mismatch by adding `timeZone: 'UTC'` to `toLocaleTimeString` options — server (UTC) and client (local timezone) rendered different strings causing React hydration to fail on the `/bookings` page.
- **`BookingsClient.tsx`**: Added flight departure date display (e.g. "Jun 10, 2026  06:46 PM - 04:46 AM") to each booking card using `toLocaleDateString` with `timeZone: 'UTC'`.

### Task 09 — Reschedule Dialog Fix (No Flights Found)
- **`RescheduleDialog.tsx`**:
  - Added `useRef` request counter (`searchReqId`) to prevent stale async responses from overwriting fresh search results (race condition fix).
  - Added user-facing toast on API search errors via `toast.error`.
  - Improved JS date filtering: explicit `dayStart`/`dayEnd` bounds using `new Date(\`${date}T00:00:00Z\`)`, `isNaN` guard on date parsing, and combined date + 2-hour filter.
- **`queries.ts`**: Changed `searchFlightsByDate` from `.eq` (exact match) to `.ilike` with wildcards (consistent with `searchFlights`), and removed Supabase-side date range filtering (`gte`/`lte`) — date filtering is now done entirely in JavaScript to avoid potential timezone/format comparison issues with `timestamptz` columns.