# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Indoo** (package name `indoo`, app ID `id.indoo.app`, domain `indoo.id`) is a location-based marketplace and social app for the Indonesian market. Users can buy/sell products, order food, book rides, date, and "go live" at venues to discover who's nearby. It runs as a PWA and Capacitor native app. Primary language: Bahasa Indonesia (with English, Arabic, Chinese support).

## Commands

```bash
npm run dev        # Start Vite dev server on port 5173
npm run build      # Production build → dist/
npm run preview    # Preview production build locally
```

Firebase Cloud Functions (in `functions/`):
```bash
cd functions && npm install   # Install function dependencies separately
firebase deploy --only functions
firebase deploy --only hosting
firebase deploy --only firestore:rules
```

Supabase migrations are in `supabase/migrations/` and the full schema is in `supabase/schema.sql`.

## Architecture

### Frontend (React + Vite)

- **Entry**: `src/App.jsx` — handles onboarding flow (welcome → profile → location gate → app) and routes `/admin` to `AdminApp`
- **Router**: `src/router/AppShell.jsx` — main app shell after auth; manages overlay stack, map view, sessions, and all bottom-sheet components
- **Path alias**: `@/` maps to `src/` (configured in `vite.config.js`)
- **Styling**: CSS Modules (`.module.css` files colocated with components)
- **State**: React Context (`src/contexts/`) — `AuthContext`, `OverlayContext`, `GuestGateContext`
- **No router library** — navigation uses an overlay enum system in `OverlayContext` and conditional rendering

### Dual Backend: Supabase + Firebase

The app uses **Supabase** as the primary backend (auth, Postgres DB, Edge Functions) and **Firebase** for Cloud Functions and Firestore (sessions, OTW requests, blocks, reports).

- `src/lib/supabase.js` — Supabase client (null in demo mode)
- Auth maps Supabase `user.id` → `user.uid` for Firebase backward compatibility
- Firestore security rules in `firestore.rules` — sessions/OTW are server-only writes
- Supabase RLS policies defined in `supabase/schema.sql`

### Key Directories

- `src/hooks/` — Custom hooks for data fetching/subscriptions (auth, geolocation, live users, sessions, meet requests, coins, etc.)
- `src/services/` — Business logic layer making Supabase/Firebase calls (session, booking, payment, moderation, driver, etc.)
- `src/components/` — UI organized by feature domain: `map/`, `chat/`, `driver/`, `golive/`, `session/`, `payment/`, `safety/`, `ui/`
- `src/screens/` — Full-page screens (auth, profile, match, chat, wallet, booking, etc.)
- `src/admin/` — Admin dashboard (login, drivers tab, bookings tab, pricing tab, notifications)
- `src/utils/` — Pure helpers (distance calc, pricing, content filter, session scoring)

### Firebase Cloud Functions (`functions/`)

Node.js 20 runtime. Key function groups:
- **Session**: `goLive`, `expireSessions`, `endSession`, `confirmCheckIn`
- **OTW (On The Way)**: `sendOtwRequest`, `respondToOtw`, `markOtwProceeding`, `cancelOtw`
- **Payments**: `createCheckoutSession`, `stripeWebhook` (Stripe integration)
- **Moderation**: `handleReport`
- **Interest**: `onInterestCreated` (mutual-like system)

### Supabase Edge Functions (`supabase/functions/`)

TypeScript. Handles Stripe checkout/webhook flows and account deletion.

## Environment Variables

All frontend env vars use the `VITE_` prefix. Copy `.env.example` to `.env` and fill in:
- Supabase URL + anon key
- Google Maps API key
- Stripe publishable key
- App config (OTW price, session duration, GPS radius, fuzz distances)

Set `VITE_DEMO_MODE=true` to run without a real backend (Supabase client becomes null, hooks use local fallbacks).

## Capacitor (Mobile)

Config in `capacitor.config.ts`. Uses `dist/` as web dir. Plugins: LocalNotifications, PushNotifications, BackgroundGeolocation.

## Note: Supabase table `hangger_news`

The Supabase table `hangger_news` still uses the old name. A database migration is needed to rename it to `indoo_news`. Until then, all queries reference `hangger_news`.
