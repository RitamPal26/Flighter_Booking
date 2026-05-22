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