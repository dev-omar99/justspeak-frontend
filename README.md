# JustSpeak Frontend

Next.js 14 (App Router) + React 18 + TypeScript + Tailwind CSS + Capacitor 8 frontend for the **JustSpeak** 1-on-1 English speaking practice platform.

---

## 1. Local Development & Verification

### Environment Variables
Configure in `.env.local` (see [`.env.example`](.env.example)):
- `NEXT_PUBLIC_API_URL`: Backend HTTP & WebSocket base URL (default: `http://localhost:4000`)
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`: Google OAuth 2.0 Web Client ID for One-Tap / Sign-In button

### Commands (Windows PowerShell)
```powershell
# Start local development server on http://localhost:3000
npm.cmd run dev

# Run TypeScript type check
npx.cmd tsc --noEmit

# Build production bundle
npm.cmd run build
```

You can also launch both backend (`:4000`) and frontend (`:3000`) from the repository root via `.\start_justspeak.bat` or `.\start_justspeak.ps1`.

---

## 2. Route & Screen Inventory (`app/`)

| Route | File | Screen Purpose & Key Features | Backend Endpoints / Data |
|---|---|---|---|
| `/` | [`app/page.tsx`](app/page.tsx) | **Landing Page** (logged out) & **Home Dashboard** (logged in — Screenshots #13, #14): active Tribe time strip, Tribe Hero, golden `"My Tribe"` card, `"Join next conversation"` live room/timer card, 7-circle `"My Streak"` card, expandable Recent Partners with `📄+` memo modal, `"Partners said: I'd love to talk again!"` compliment card, and `"Never meet again"` manager | `GET /users/dashboard`, `POST /users/buddy/:id`, `POST /users/tribe`, `POST /rooms/buddy-call`, `GET /users/blocked`, `DELETE /users/blocked/:id` |
| `/invite` | [`app/invite/page.tsx`](app/invite/page.tsx) | **Invite Friends & Prime Gift** (Screenshot #10): 3D golden gift box, `"a 10-day Prime membership!"`, 3 dashed ticket slots, Web Share / clipboard invite link, `"Invitation history"` modal, and `"Pending invitations"` card | `GET /users/dashboard` + `localStorage` (`justspeak_invite_history`) |
| `/login` | [`app/login/page.tsx`](app/login/page.tsx) | **Sign In**: Google Sign-In, Phone + Password, and Email + Password authentication | `POST /auth/google`, `POST /auth/login` |
| `/signup` | [`app/signup/page.tsx`](app/signup/page.tsx) | **Sign Up**: Google Sign-In, Phone OTP verification (`send-otp` / `verify-otp`), and Email + Password registration | `POST /auth/google`, `POST /auth/send-otp`, `POST /auth/verify-otp`, `POST /auth/signup` |
| `/onboarding` | [`app/onboarding/page.tsx`](app/onboarding/page.tsx) | **3-Step Onboarding**: speaking goal selection, CEFR level placement (`Beginner` / `Intermediate` / `Advanced`), and daily Tribe 1–12 routine slot | `PATCH /users/profile`, `POST /users/tribe` |
| `/queue` | [`app/queue/page.tsx`](app/queue/page.tsx) | **Pre-Join Check & Dark Waiting Room** (Screenshots #1, #5, #6, #7, #15, #16): Step 1 Pre-Join camera & 3-checkmark etiquette check + `"Please don't skip the survey"` modal, Step 2 Dark Waiting Room (`20s` / `12s` countdown, rotating community rules, right 3-button rail), Step 3 Survey Wait (`+5 Contribution points!` toast & Tips guide), and Step 4 Exit screen | `POST /rooms/queue`, `POST /rooms/leave` |
| `/room/[roomName]` | [`app/room/[roomName]/page.tsx`](app/room/%5BroomName%5D/page.tsx) | **1-on-1 WebRTC Video Call Room** (Screenshots #2, #3, #4, #17): Full-Screen Partner View, Host Guide Stage, and Illustrated Topic Stage; 5-button vertical right rail (`👤`, `👥`, `💬`, `🎙️`, `🕒↪️` Scheduled-to-leave banner); `📄+ Memo` pill; and `"Disconnected — Your ticket has been recovered"` modal | Socket.IO `/` (`join-room`, `offer`, `answer`, `ice-candidate`, `chat-message`, `reaction`, `next-topic`), `POST /rooms/recover-ticket` |
| `/feedback` | [`app/feedback/page.tsx`](app/feedback/page.tsx) | **Post-Call Survey & Nice People Summary** (Screenshot #18): 2-question post-session survey followed by `"Today, you met these nice people!"` celebration summary with high-five illustration, liked partners list with `📄+` memo editor, and `Go Home` button | `POST /feedback`, `GET /users/dashboard` |
| `/practice` | [`app/practice/page.tsx`](app/practice/page.tsx) | **Speaking Fluency Vault**: 6 categories of conversational connectors (24 phrases) with Web Speech API `speechSynthesis` audio playback and practice checkmarks (`localStorage`) | Client-side + `localStorage` (`justspeak_mastered_phrases`) |
| `/leaderboard` | [`app/leaderboard/page.tsx`](app/leaderboard/page.tsx) | **Global & Tribe Leaderboard**: Top 3 podium + table for Minutes Spoken, Streak Champions, Most Loved, and Tribe 12 rankings | `GET /users/leaderboard` |
| `/achievements` | [`app/achievements/page.tsx`](app/achievements/page.tsx) | **Achievement Hub** (Screenshots #19, #12): `Total Sessions` card with 3D chat bubbles & Share, `English fluency ratings` (`30 sessions required`), `Contribution points` (`P`), `Partners Milestone Card`, `Total Countries` passport modal, and `My Streak` modal | `GET /users/dashboard` |
| `/memos` & `/board` | [`app/memos/page.tsx`](app/memos/page.tsx) | **Board, Memos & Topic Library** (Screenshot #8): `Why JustSpeak`, `Guidelines`, and `FAQ` drawers, `Posts` feed (`7-Day Habit` & `EASY Bonus Tickets` cards), Partner Memos notebook, and 12-topic Speaking Library | `GET /users/dashboard` + `localStorage` (`justspeak_partner_memos`) |
| `/profile` | [`app/profile/page.tsx`](app/profile/page.tsx) | **My Page Hub** (Screenshot #11): top-right `⚙️` Profile & Photo Upload editor, golden shield user row, `My Buddies` drawer, `Invite and get a 10-day Prime membership!` banner, `Match history`, `My memos`, `Match settings`, `Never meet again`, and `JustSpeak Chatbot` | `GET /users/dashboard`, `PATCH /users/profile`, `GET /users/buddies`, `GET /users/blocked`, `DELETE /users/blocked/:id` |
| `/admin` | [`app/admin/page.tsx`](app/admin/page.tsx) | **Admin Dashboard**: platform-wide counters (users, sessions, feedbacks, blocks) and user management table with two-step delete confirmation | `GET /admin/users`, `GET /admin/stats`, `DELETE /admin/users/:id` |


---

## 3. Shared Component & Design System Inventory

### Reusable Components (`components/`)
- [`Header.tsx`](components/Header.tsx): Sticky dark glassmorphic top navigation (`#0B132B/95`), 3D penguin brand mark, desktop navigation pills (`Home`, `Practice`, `Leaderboard`, `Passport`, `Memos`, `My Page`), Daily Passes badge, Admin link, and privacy-safe user avatar chip (updates automatically on `[pathname]`).
- [`BottomNav.tsx`](components/BottomNav.tsx): Mobile bottom navigation bar (`md:hidden`) for authenticated users. Automatically hides on full-screen flow routes (`/room/*`, `/queue`, `/feedback`, `/login`, `/signup`, `/onboarding`) so bottom call controls and auth forms are never obstructed.
- [`Button.tsx`](components/Button.tsx): Reusable button with `primary`, `secondary`, and `danger` variants, loading spinner state, and `fullWidth` toggle.
- [`Penguin3D.tsx`](components/Penguin3D.tsx): Animated 3D SVG mascot (`default` and `headphones` variants; `sm`, `md`, `lg`, `xl` sizes).
- [`PageTransition.tsx`](components/PageTransition.tsx): Smooth fade-up entry wrapper for page content.
- [`WorldConnectAnimation.tsx`](components/WorldConnectAnimation.tsx): Ambient animated world connection backdrop for hero/landing views.
- [`Confetti.tsx`](components/Confetti.tsx): Celebration overlay used on `/feedback` and `/achievements`.

### Design Tokens (`tailwind.config.js` & `app/globals.css`)
- **Colors**:
  - `primary`: `#2563EB` (`primary-dark`: `#1D4ED8`, `primary-light`: `#EFF6FF`)
  - `ink`: `#0F172A` (`ink-soft`: `#475569`)
  - `surface`: `#F8FAFC`
  - `border`: `#E2E8F0`
  - `success`: `#16A34A`, `danger`: `#DC2626`
- **Typography**: `Cairo` and `Inter` (`font-sans`), supporting both English (LTR) and Arabic (RTL) via [`lib/i18n.tsx`](lib/i18n.tsx).
- **Card & Surface Utilities**: `.shelf-card` (hover elevation transition), `.penguin-3d-float`, `rounded-3xl` cards with `border-border/60` and `shadow-xl shadow-primary/5`.

---

## 4. Screenshot-Driven Screen Implementation Workflow

When implementing new screens or updating existing views from screenshots:
1. **Classify the Target**:
   - Determine whether the screenshot represents a new route in `app/<route>/page.tsx`, an update to one of the 13 existing routes, or a modal/drawer state inside an existing page.
2. **Reuse Shared Primitives**:
   - Wrap standard pages in `<main className="min-h-screen flex flex-col bg-surface pb-24 md:pb-16">`, `<Header />`, and `<PageTransition>`.
   - If the new route is a full-screen flow without bottom navigation on mobile, add its path prefix to `hiddenRoutes` in [`components/BottomNav.tsx`](components/BottomNav.tsx).
   - If it is a primary top-level destination, add it to `navLinks` in [`components/Header.tsx`](components/Header.tsx) and `navItems` in [`components/BottomNav.tsx`](components/BottomNav.tsx).
3. **Wire API & Types**:
   - Add request/response interfaces in [`types/index.ts`](types/index.ts), client methods in [`services/api.ts`](services/api.ts), and corresponding NestJS DTOs/endpoints in `justspeak_backend/src/`.
4. **Verify**:
   - Run `npx tsc --noEmit` and `npm run build` in this repo, plus `npx jest` in the backend repo.

---

## AI Partner Section (`/ai-partner`)

Live voice practice with an AI speaking coach: goal-driven roleplay scenarios, interview practice, guided lessons, deterministic word-choice analytics, scored reports, and a recordings library. The section lives under [`app/ai-partner/`](app/ai-partner/) with its client in [`services/ai-partner.ts`](services/ai-partner.ts), appears on the home dashboard via [`components/home/AiPartnerHomeSection.tsx`](components/home/AiPartnerHomeSection.tsx), and is feature-flagged: set `NEXT_PUBLIC_AI_PARTNER_ENABLED=true` to enable it (off by default, visitors see a quiet coming-soon notice). The backend side is `src/ai-partner/` in the backend repo, flagged separately by `JUSTSPEAK_AI_ENABLED`.

---

## 5. Deferred Production-Readiness Checklist

Items intentionally deferred during active feature & screen development:
- **Database Migration Deployment**: Apply `20261017233000_security_hardening` to `justspeak_db` (`npx.cmd prisma migrate deploy`) once approved.
- **SMS OTP Provider Integration**: Connect `AuthService.sendOtp` (`type === 'phone'`) to a real SMS gateway (Twilio / Vonage / AWS SNS) for production phone OTP delivery.
- **Production SMTP Credentials**: Configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, and `SMTP_FROM` in production environment variables.
- **TURN Server for WebRTC**: Add TURN relay credentials (`RTCIceServer`) in [`app/room/[roomName]/page.tsx`](app/room/%5BroomName%5D/page.tsx) alongside the Google STUN servers for strict symmetric NATs.
- **Multi-Instance Redis Adapter**: If scaling `justspeak_backend` beyond a single Node.js instance, back the matchmaking queue, throttler storage, and Socket.IO adapter with Redis.
