# Duolingo Clone — SDE Fullstack Assignment

A functional clone of the Duolingo web app: a skill-tree learning path, a lesson player with five distinct exercise types, XP/streak/hearts gamification, a live leaderboard, a real achievements system, dark mode, a fully responsive layout, and a bonus timed "Legendary" challenge mode.

Built for the SDE Fullstack Assignment. Every feature described in this README is backed by working code — the "Feature & Bonus Checklist" section maps each requirement directly to the file and function that implements it.

---

## Table of Contents

1. [Demo](#demo)
2. [Tech Stack](#tech-stack)
3. [Architecture Overview](#architecture-overview)
4. [Database Schema](#database-schema)
5. [API Overview](#api-overview)
6. [Core Feature Walkthrough](#core-feature-walkthrough)
7. [Gamification Logic in Detail](#gamification-logic-in-detail)
8. [Mocked / Placeholder Sections](#mocked--placeholder-sections)
9. [Setup Instructions](#setup-instructions)
10. [Feature & Bonus Checklist](#feature--bonus-checklist)
11. [Assumptions & Known Simplifications](#assumptions--known-simplifications)
12. [Original Work Statement](#original-work-statement)

---

## Demo

| | Link |
|---|---|
| **GitHub repo** | [pjay24/Duolingo-Web-App-clone-](https://github.com/pjay24/Duolingo-Web-App-clone-) |
| **Live deployed app** | [duolingo2-ten.vercel.app](https://duolingo2-ten.vercel.app/) |
| **Video walkthrough** | `<add video link here — 2–3 min covering path → lesson → complete → legendary → dark mode → responsive>` |

### Screenshots

> Replace these with actual screenshots/GIFs before submitting.

| Learning Path | Lesson Player | Lesson Complete |
|---|---|---|
| `<screenshot: path screen, light mode>` | `<screenshot: multiple choice exercise>` | `<screenshot: confetti + XP/streak modal>` |

| Profile | Leaderboard | Dark Mode |
|---|---|---|
| `<screenshot: profile with achievements>` | `<screenshot: leaderboard>` | `<screenshot: any screen in dark mode>` |

| Mobile (bottom nav) | Desktop (sidebar) | Legendary Mode |
|---|---|---|
| `<screenshot: phone width>` | `<screenshot: desktop width w/ sidebar>` | `<screenshot: legendary challenge screen>` |

---

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | Next.js 16 (App Router), TypeScript, Tailwind CSS v4 | Server components fetch fresh state per request; App Router gives clean route-per-screen structure matching Duolingo's own IA (`/`, `/lesson/[skillId]`, `/leaderboard`, `/profile`, `/settings`, `/legendary`) |
| Backend | Python, FastAPI, SQLAlchemy ORM | FastAPI's automatic request validation + fast iteration speed; SQLAlchemy keeps the schema in one place (`models.py`) as the source of truth |
| Database | SQLite (file-based) | Zero setup, persists across restarts, matches the assignment's explicit requirement — schema is designed to be swappable to Postgres later since it's plain SQLAlchemy |
| Audio | Web Audio API (synthesized SFX) + browser `SpeechSynthesis` (TTS) | No external files, no API keys, no licensing concerns — every sound is generated in-browser from oscillators |
| Styling | Tailwind utility classes, custom hex values matched to Duolingo's real palette (`#58CC02` green, `#1CB0F6` blue, `#FFC800` gold, `#FF4B4B` red, `#CE82FF` purple) | Closest visual fidelity without shipping Duolingo's actual assets |

---

## Architecture Overview

```
duolingo-clone/
├── frontend/                      Next.js app (TypeScript)
│   ├── app/                       Routes (one folder per screen)
│   │   ├── page.tsx                → / (Learning Path)
│   │   ├── lesson/[skillId]/       → Lesson Player
│   │   ├── legendary/              → Legendary Challenge
│   │   ├── leaderboard/            → Leaderboard
│   │   ├── profile/                → Profile
│   │   ├── settings/               → Settings
│   │   └── layout.tsx              Root layout: wraps app in ThemeProvider + ToastProvider, renders SideNav/BottomNav
│   ├── components/                 Screens (PathScreen, LessonPlayer, ProfileScreen, ...),
│   │   ├── exercises/               One component per exercise type
│   │   └── ...                      Modals, TopBar, nav, providers
│   └── lib/                        api.ts (typed fetch wrapper), types, sound.ts, speech.ts
│
└── backend/                        FastAPI app
    └── app/
        ├── main.py                 All API routes + game logic (heart regen, streak, XP, achievements)
        ├── models.py                SQLAlchemy models — the schema, in one place
        ├── database.py              SQLite engine/session setup
        └── seed.py                  One-time seed script — course content + sample users (idempotent)
```

**Request flow.** Each Next.js route is a **server component** that calls `lib/api.ts` at request time (`cache: "no-store"`, so it's always fresh, never stale) to fetch state from FastAPI, then hands that data down to a **client component** for interactivity (e.g. `PathScreen`, `LessonPlayer`). There is no client-side global store (no Redux/Zustand/Context-as-database) — every screen re-fetches from the backend on navigation, and FastAPI + SQLite is the single source of truth for all persisted state. This keeps the mental model simple: if you refresh the page, you see exactly what's in the database, nothing cached client-side can drift out of sync.

**Auth model.** There is no real authentication, per the assignment's explicit allowance to "assume a default logged-in learner." A single hardcoded `USER_ID = 1` constant in `main.py` is used on every backend route. Two additional seeded users (`Maria`, `Sam`) exist purely to populate a non-trivial leaderboard.

**Styling approach.** No component library — every screen is built from raw Tailwind utility classes matched by eye against Duolingo's real UI (button "pressed" states via `shadow-[0_Npx_0_0_#color]` + `active:translate-y-1`, the winding path via per-node `translateX` offsets, the green/gold/gray skill node states, etc.).

---

## Database Schema

All tables are defined in `backend/app/models.py` using SQLAlchemy's declarative ORM. SQLite is the engine, but nothing here is SQLite-specific — the same models would work unchanged against Postgres or MySQL.

### Entity-Relationship Summary

```
courses ──< units ──< skills ──< lessons ──< exercises

users ──< user_skill_progress >── skills
users ──< lesson_attempts
users ──< user_achievements >── achievements
```

### Table Reference

| Table | Purpose | Key Columns | Relationships |
|---|---|---|---|
| **`users`** | The learner (plus seeded competitors for the leaderboard) | `id`, `name`, `xp_total`, `gems`, `hearts`, `last_heart_lost_at`, `streak_count`, `last_active_date`, `daily_xp_goal`, `created_at` | Referenced by `user_skill_progress`, `lesson_attempts`, `user_achievements` |
| **`courses`** | A language course (one seeded: Spanish) | `id`, `title`, `language_code` | Parent of `units` |
| **`units`** | Groups of skills within a course (e.g. "Unit 1: Basics") | `id`, `course_id` (FK), `title`, `order_index` | Belongs to `courses`; parent of `skills` |
| **`skills`** | A single node on the path (e.g. "Greetings", "Food") | `id`, `unit_id` (FK), `title`, `icon`, `order_index`, `max_crowns` | Belongs to `units`; parent of `lessons`; tracked per-user in `user_skill_progress` |
| **`lessons`** | A lesson within a skill | `id`, `skill_id` (FK), `order_index` | Belongs to `skills`; parent of `exercises`; referenced by `lesson_attempts` |
| **`exercises`** | One question within a lesson | `id`, `lesson_id` (FK), `order_index`, `type`, `prompt`, `data` (JSON), `correct_answer` (JSON) | Belongs to `lessons` |
| **`user_skill_progress`** | Per-user progress on each skill (join table) | `id`, `user_id` (FK), `skill_id` (FK), `crowns_earned`, `status` (`locked` / `available` / `completed`), `last_practiced_at` | Links `users` ↔ `skills` |
| **`lesson_attempts`** | A log of every completed lesson or Legendary run — this is what "today's XP" is summed from | `id`, `user_id` (FK), `lesson_id` (FK, nullable for Legendary runs), `started_at`, `completed_at`, `xp_earned`, `hearts_lost`, `passed` | Belongs to `users`, optionally to `lessons` |
| **`achievements`** | Badge *definitions* (static catalog) | `id`, `code`, `title`, `description`, `icon` | Referenced by `user_achievements` |
| **`user_achievements`** | Which badges a user has actually earned, and when (join table) | `id`, `user_id` (FK), `achievement_id` (FK), `earned_at` | Links `users` ↔ `achievements` |

### Design Rationale

- **`courses → units → skills → lessons → exercises`** is a plain one-to-many chain, matching Duolingo's real content hierarchy one-to-one. This makes seeding predictable and would scale cleanly to more courses/units without any schema change.
- **`user_skill_progress` and `user_achievements` are join tables**, not columns bolted onto other tables. This means the *same* seeded course content and achievement catalog can serve multiple users (which is exactly what powers the leaderboard — `Maria` and `Sam` progress independently against the same `skills` rows) without duplicating content per user.
- **`exercises.data` and `exercises.correct_answer` are JSON columns, not fixed relational columns.** Each of the 5 exercise types needs a fundamentally different shape:
  - `multiple_choice` → `{"options": [...]}` / `{"index": 0}`
  - `translate_tap` → `{"word_bank": [...]}` / `{"sequence": [...]}`
  - `match_pairs` → `{"pairs": [{"left", "right"}, ...]}` / `{"map": {left: right}}`
  - `fill_blank` → `{"sentence": "___ tardes.", "options": [...]}` / `{"value": "..."}`
  - `type_answer` → `{"prompt_translation_hint": "..."}` / `{"accepted": ["Por favor", "por favor"]}`

  A single flexible `JSON` column per field is simpler and more extensible than five separate exercise tables for this scope, and it means adding a 6th exercise type later requires zero migrations — just a new `type` string and a new shape convention.
- **`lesson_attempts` is an append-only log**, not a mutable "current state" row. `xp_today` (shown in the daily-goal progress bar) is computed live by summing `xp_earned` across attempts completed on the simulated "today" — so the daily goal indicator reflects *actual activity*, it isn't a separately-tracked counter that could drift out of sync with reality.
- **Hearts regeneration is time-based, not a background job.** `users.last_heart_lost_at` stores a timestamp; `apply_heart_regen()` is called at the top of every relevant route and computes how many 30-minute intervals have elapsed since that timestamp, credits that many hearts, and advances the reference timestamp by the *consumed* intervals (not resetting it to "now") — so partial progress toward the next heart is never lost, and no cron/scheduler is needed.

---

## API Overview

All routes are prefixed `/api`. No auth headers required — every route operates against the single hardcoded `USER_ID`.

| Method | Route | Purpose | Key logic |
|---|---|---|---|
| `GET` | `/api/path` | Skill tree + user stats | Applies heart regen, builds the unit→skill tree with per-skill `status`/`crowns_earned`, computes `xp_today` |
| `GET` | `/api/skills/{skill_id}/lesson` | Exercises for that skill's lesson | Returns exercises ordered by `order_index`; `correct_answer` intentionally withheld from this response |
| `POST` | `/api/lessons/{lesson_id}/answer` | Grade one exercise answer | Type-specific comparison logic (see below); deducts a heart only if wrong *and* hearts > 0 |
| `POST` | `/api/lessons/{lesson_id}/complete` | Award XP, update streak, unlock next skill, check achievements | Awards flat 15 XP, sets crowns to `max_crowns`, unlocks the next skill in path order, checks both achievement conditions |
| `GET` | `/api/profile` | Stats + earned/locked achievements | Splits the full achievement catalog into earned vs. locked based on `user_achievements` |
| `GET` | `/api/leaderboard` | All seeded users ranked live | `ORDER BY xp_total DESC`, ranks assigned by enumeration — always reflects current state, nothing pre-computed |
| `POST` | `/api/hearts/refill` | Mocked instant refill to full hearts | Sets `hearts = 5`, clears the regen timer implicitly |
| `POST` | `/api/settings/daily-goal` | Update the user's daily XP goal | Validates `daily_xp_goal` is a positive integer |
| `GET` | `/api/legendary/challenge` | Generate a Legendary round set | Pulls every Spanish→English pair from every seeded `match_pairs` exercise across the whole course, shuffles, builds 4-option multiple-choice rounds with 3 distractors each |
| `POST` | `/api/legendary/answer` | Grade one Legendary round | Simple lookup against the same pooled vocab map |
| `POST` | `/api/legendary/complete` | Award bonus XP for a perfect run | 30 XP only if `correct_count == total_rounds`; still updates streak even on an imperfect run |
| `POST` | `/api/debug/advance-day` | Testing hook — simulates a day passing | Increments a global `SIMULATED_DAY_OFFSET` so streak logic can be exercised without waiting real time |

### Answer-grading logic per exercise type (`/api/lessons/{id}/answer`)

| Type | Comparison |
|---|---|
| `multiple_choice`, `fill_blank`, `translate_tap` | Direct equality: submitted answer must exactly match the stored `correct_answer` JSON shape |
| `match_pairs` | Looks up `correct_answer["map"][left] == right` — each pair is graded independently as the user taps them |
| `type_answer` | Case-insensitive, whitespace-trimmed match against a list of `accepted` strings (so `"por favor"` and `"Por favor"` both pass) |

---

## Core Feature Walkthrough

### 1. Learning Path / Skill Tree — `PathScreen.tsx` + `SkillNodeButton.tsx`

- Skills render in a winding path using a fixed `WAVE_PATTERN` of horizontal offsets, matching Duolingo's zig-zag layout.
- Each skill node is one of three visual states, driven directly by `user_skill_progress.status`:
  - **Locked** — gray circle, 🔒 icon, `disabled` button, no progress ring.
  - **Available** — green circle with a signature drop-shadow "pressed" edge, active.
  - **Completed** — gold circle, same pressed-edge style.
- **Progress ring**: an SVG `<circle>` with `strokeDasharray`/`strokeDashoffset` computed from `crowns_earned / max_crowns`, rotated -90° so it starts at 12 o'clock like Duolingo's real rings.
- **Top bar** (`TopBar.tsx`): streak 🔥, gems 💎 (tappable → Coming Soon), hearts ❤️ (shows a live countdown to the next regenerated heart), XP ⭐, and a daily-goal progress bar underneath — all sourced from the same `/api/path` response, no separate fetch.

### 2. Lesson Player — `LessonPlayer.tsx`

The core loop, one exercise at a time:

1. Render the current exercise by `type` (5 possible components).
2. On answer submit → `POST /api/lessons/{id}/answer` → backend grades it, deducts a heart if wrong.
3. **`FeedbackBar`** slides up showing correct (green) or incorrect (red, with the correct answer revealed) — the signature Duolingo feedback bar.
4. Tapping "Continue" advances to the next exercise, or, on the last exercise, calls `POST /api/lessons/{id}/complete`.
5. If hearts hit 0 on a wrong answer, **`OutOfHeartsModal`** appears after a short delay (so the feedback bar is seen first) offering a free "practice to refill" or "end lesson" — there's no hard dead-end, matching the assignment's guidance that lesson failure just needs to be *handled*, not necessarily block progress.
6. On completion, **`LessonCompleteModal`** shows XP earned, new total, crowns, and a full confetti animation (140 pieces, generated client-side post-mount to avoid server/client hydration mismatches from `Math.random()`).
7. Toasts + a prioritized sound effect fire for whichever completion event is most significant: achievement unlocked > skill unlocked > streak saved > plain lesson complete — so the user never gets three overlapping sounds/toasts stacked on one screen.

### 3. Gamification & Progress

Covered in depth in the next section.

### 4. Content Management

- All course content (`courses`, `units`, `skills`, `lessons`, `exercises`) lives in the database, populated once by `backend/app/seed.py` — **1 course, 2 units, 7 skills, 7 lessons, 35 exercises** (5 per lesson, covering all 5 types at least once per lesson), plus 3 users and 2 achievement definitions.
- The learner profile (`ProfileScreen.tsx` / `/api/profile`) shows XP, streak, hearts (with a refill button if not full), and a grid of earned vs. locked achievement badges.

### 5. Duolingo Experience

- Playful, colorful UI with the 🦉 mascot standing in as the avatar throughout (nav, account row, leaderboard entries).
- Animated feedback bar, confetti on lesson complete, toast notifications (`ToastProvider.tsx`, auto-dismiss after 3s).
- Settings placeholders for everything the assignment marks as explicitly out-of-scope (see below).

---

## Gamification Logic in Detail

| Mechanic | Implementation |
|---|---|
| **XP** | Flat 15 XP per completed lesson, 30 XP for a *perfect* Legendary run (0 for an imperfect one). Stored on `users.xp_total`; `xp_today` is derived live from `lesson_attempts`, not stored separately. |
| **Streak** | `apply_daily_streak()`: if the user already has activity logged for "today" (simulated), no-op. If their last active day was yesterday (or this is their first-ever activity), increment by 1. If more than one day was skipped, **reset to 1** rather than to 0 — the day you come back still counts as day one of a new streak. Testable without waiting real time via `POST /api/debug/advance-day`, which advances a global day offset used everywhere "today" is computed. |
| **Hearts** | Start at 5 (`MAX_HEARTS`). Lose 1 per wrong answer (never below 0). Regenerate 1 every 30 minutes based on real elapsed wall-clock time since `last_heart_lost_at` — computed on-demand in `apply_heart_regen()`, called at the top of `/api/path`, `/api/profile`, and `/api/lessons/{id}/answer`, so the value is always accurate without any background scheduler. A mocked instant "practice to refill" (`POST /api/hearts/refill`) is also available, matching the assignment's "mocked practice/refill" allowance. |
| **Crowns** | Each skill has `max_crowns = 5`. Completing its lesson sets `crowns_earned` to the full 5 in one shot (see [Assumptions](#assumptions--known-simplifications) for why). The progress ring on the skill node visualizes `crowns_earned / max_crowns`. |
| **Skill unlocking** | On lesson completion, the backend looks up all skills globally ordered by `(unit.order_index, skill.order_index)` — the same ordering the path UI renders in — finds the just-completed skill's position, and flips the *next* skill's status from `locked` to `available` (creating its progress row if it doesn't exist yet). |
| **Leaderboard** | Not a static seeded list — `GET /api/leaderboard` runs a live `ORDER BY xp_total DESC` across all users every time it's called, so completing lessons as the default user visibly moves your rank in real time. |
| **Daily goal** | User-configurable (10/20/30/50 XP presets in Settings), persisted via `POST /api/settings/daily-goal`. The top-bar progress bar compares live `xp_today` against this goal. |
| **Achievements** | Two real, condition-checked badges: **Century Club** (🏅, `xp_total >= 100`) and **Monthly Master** (🔥, `streak_count >= 30`). Checked on every lesson completion; awarding is idempotent (checks `user_achievements` for an existing row before inserting) so re-crossing the threshold doesn't duplicate the badge. New unlocks surface immediately via toast + a dedicated fanfare sound. |
| **Audio** | Every gamification event has its own **synthesized** sound (`lib/sound.ts`) — correct (bright two-note bell), incorrect (descending buzz), lesson complete (ascending run + chord), hearts refilled (rising sweep), achievement unlocked (fuller fanfare), skill unlocked (pop + shimmer), streak saved (flickering triad) — all built from raw Web Audio oscillators, so there are zero audio files or API keys involved. Spanish vocabulary itself is read aloud via the browser's native `SpeechSynthesis` API (`lib/speech.ts`), wired to every 🔊 speaker icon in exercises. |

---

## Mocked / Placeholder Sections

Per the assignment's explicit allowance, the following are present as clearly-labeled placeholders rather than real functionality:

| Section | Where it appears in the UI | Treatment |
|---|---|---|
| Real speech recognition / pronunciation exercises | Settings → "Coming Soon" grid | Card with a "Coming Soon" badge. (Note: playback TTS *is* real — see Gamification table above — only speech *recognition/scoring* is mocked.) |
| Super subscription / in-app purchases | Settings → "Coming Soon" grid; tapping the 💎 gem stat in the top bar also surfaces a toast | Gems are a static seeded number (`users.gems`, default 500), never spent or purchasable |
| Friends / social features | Settings → "Coming Soon" grid; Leaderboard screen has a Global/Friends tab toggle, where "Friends" shows the same placeholder card | The seeded, live-ranked Global leaderboard covers the "social" angle the assignment allows in its place |
| Multiple languages | Settings → Account section, "Change" button next to "Learning Spanish 🇪🇸" | One seeded course (Spanish); tapping "Change" surfaces a toast rather than switching |
| Real user authentication | Settings → Account section, "Sign in with Google" row | Single hardcoded `USER_ID = 1` on the backend; the row is present but non-functional |

All five are centralized in one reusable component (`frontend/components/ComingSoonBanner.tsx`) so the wording/iconography is consistent everywhere they appear, and the grid is responsive (1 column on mobile, 2 columns on tablet/desktop).

---

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- Python 3.10+

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Seed the database (run once — safe to re-run, it no-ops if already seeded)
python -m app.seed

# Start the API
uvicorn app.main:app --reload --port 8000
```

Backend runs at `http://127.0.0.1:8000`. Interactive API docs (auto-generated by FastAPI) are available at `http://127.0.0.1:8000/docs`.

### Frontend

```bash
cd frontend
npm install

# .env.local should point at the backend:
echo "NEXT_PUBLIC_API_URL=http://127.0.0.1:8000" > .env.local

npm run dev
```

Frontend runs at `http://localhost:3000`.

## Deployment

Deploy the project as two separate services:

1. Backend first on Render, Railway, or Fly.io
2. Frontend on Vercel

### Backend deployment

Use the `backend/` folder as the project root on your host.

Set these runtime values:

- Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Python version: `3.10+`
- Environment variable: `FRONTEND_ORIGINS` set to your Vercel URL, for example `https://your-project.vercel.app`

The backend stores data in SQLite at `backend/app/database.py`, so choose a host that supports a persistent disk if you want the database to survive redeploys.

### Frontend deployment

Use the `frontend/` folder as the project root on Vercel.

Set this environment variable:

- `NEXT_PUBLIC_API_URL` = your deployed backend URL, for example `https://your-backend.onrender.com`

The frontend reads that value in `frontend/lib/api.ts`, so once it is set the app will call the live backend automatically.

### Final publish checklist

- Confirm the backend URL responds successfully in a browser.
- Confirm the frontend loads and can fetch `/api/path`.
- Add the remaining screenshots and video walkthrough link when available.

---

## Feature & Bonus Checklist

A single table covering every requirement in the assignment — core, bonus, and explicitly-mocked — with what was actually built and where.

| Category | Item | Status | Implementation |
|---|---|---|---|
| Core — Path | Visual path/tree, lock → available → completed states | ✅ | `SkillNodeButton.tsx`, driven by `user_skill_progress.status` |
| Core — Path | Progress rings/crowns per skill | ✅ | SVG ring in `SkillNodeButton.tsx`, `crowns_earned / max_crowns` |
| Core — Path | Top bar: streak, XP, hearts, gems | ✅ | `TopBar.tsx` + `/api/path` |
| Core — Lesson | Multiple choice exercise | ✅ | `exercises/MultipleChoiceExercise.tsx` |
| Core — Lesson | Translate / word-bank (tap-the-words) | ✅ | `exercises/TranslateTapExercise.tsx` |
| Core — Lesson | Match pairs | ✅ | `exercises/MatchPairsExercise.tsx` |
| Core — Lesson | Fill in the blank | ✅ | `exercises/FillBlankExercise.tsx` |
| Core — Lesson | Type the answer | ✅ | `exercises/TypeAnswerExercise.tsx` |
| Core — Lesson | Immediate correct/incorrect feedback bar | ✅ | `FeedbackBar.tsx` |
| Core — Lesson | Lesson progress bar | ✅ | `LessonProgressBar.tsx` |
| Core — Lesson | Hearts lose on wrong answer, lesson end/failure handled | ✅ | `/api/lessons/{id}/answer` + `OutOfHeartsModal.tsx` |
| Core — Lesson | Award XP + mark skill progress on completion | ✅ | `/api/lessons/{id}/complete` |
| Core — Gamification | Streak increments daily, resets if a day is missed | ✅ | `apply_daily_streak()`, testable via `/api/debug/advance-day` |
| Core — Gamification | XP totals + leaderboard | ✅ | `/api/leaderboard`, live `ORDER BY xp_total DESC` |
| Core — Gamification | Hearts regenerate over time / mocked refill | ✅ | `apply_heart_regen()` + `/api/hearts/refill` |
| Core — Gamification | Daily goal / XP goal indicator | ✅ | `TopBar.tsx` progress bar, backed by real `xp_today` |
| Core — Gamification | All progress persists per user | ✅ | SQLite via SQLAlchemy, no client-side state store |
| Core — Content | Course content stored in DB + seeded | ✅ | `seed.py` — 1 course, 2 units, 7 skills, 35 exercises |
| Core — Content | Learner profile page with stats + achievements | ✅ | `ProfileScreen.tsx` + `/api/profile` |
| Core — Experience | Playful, colorful, gamified UI with mascot flourishes | ✅ | 🦉 mascot throughout, Duolingo color palette |
| Core — Experience | Animated lesson feedback | ✅ | `FeedbackBar.tsx` slide-up animation |
| Core — Experience | Modals: lesson complete, out of hearts | ✅ | `LessonCompleteModal.tsx`, `OutOfHeartsModal.tsx` |
| Core — Experience | Toasts + celebratory states | ✅ | `ToastProvider.tsx`, confetti in `LessonCompleteModal.tsx` |
| Core — Experience | Settings placeholders | ✅ | `SettingsScreen.tsx` + `ComingSoonBanner.tsx` |
| Bonus | Audio for exercises | ✅ | Synthesized SFX (`sound.ts`) + browser TTS (`speech.ts`) — no files/API keys |
| Bonus | Achievements / badges system | ✅ | DB-backed, real unlock conditions (100 XP, 30-day streak), idempotent awarding |
| Bonus | Real functioning leaderboard across seeded users | ✅ | Live-ranked, not a static mock |
| Bonus | Timed practice / "Legendary" challenge mode | ✅ | `LegendaryChallengePlayer.tsx` — countdown timer, one mistake ends the run, bonus XP on a perfect clear, pulls vocab from the entire seeded course |
| Bonus | Dark mode | ✅ | `ThemeProvider.tsx`, app-wide, custom palette matching Duolingo's real dark theme |
| Bonus | Responsive design (mobile/tablet/desktop) | ✅ | Bottom nav (mobile) → sidebar nav (desktop), breakpoint-adapted widths throughout |
| Mocked (permitted) | Speech recognition / pronunciation | ⏳ Coming Soon | `ComingSoonBanner.tsx` in Settings |
| Mocked (permitted) | Super subscription / IAP | ⏳ Coming Soon | Gems mocked (`users.gems`); tappable in `TopBar.tsx` |
| Mocked (permitted) | Friends / social features | ⏳ Coming Soon | Friends tab in `LeaderboardScreen.tsx`; Global leaderboard covers the social angle |
| Mocked (permitted) | Multiple languages | ⏳ Coming Soon | One seeded course (Spanish); "Change" button in Settings |
| Mocked (permitted) | Real user authentication | ⏳ Coming Soon | Hardcoded `USER_ID = 1`; "Sign in with Google" row in Settings |

---

## Assumptions & Known Simplifications

- **One lesson per skill.** Each skill has exactly one seeded lesson; completing it immediately awards all 5 crowns rather than building up crowns across multiple lesson attempts. This was chosen to keep seeded content small, per the assignment's own guidance ("a small amount of seeded course content"). The unlock *mechanism* (`user_skill_progress`, next-skill unlocking) supports multiple lessons per skill unchanged if more were added later — no schema change needed.
- **Flat XP per lesson** (15 XP), regardless of accuracy or mistakes made. The frontend does send `correct_count` and `hearts_lost` to the completion endpoint; they're captured on the `lesson_attempts` row but not currently used to scale the XP reward — a natural next step if accuracy-based scoring were wanted.
- **No hard lesson failure.** Running out of hearts shows a modal with an unlimited, free "practice to refill" option rather than blocking progress entirely — there's always a way to keep going short of quitting. This matches the assignment's phrasing ("lesson end/failure handled") without introducing a punitive dead-end.
- **Streak simulation.** Real day-boundary logic (increments daily, resets to 1 if a day is missed) is implemented for real, not hardcoded — and can be exercised without waiting a real day via `POST /api/debug/advance-day`, which advances a global simulated-day offset used consistently everywhere "today" matters (streak, `xp_today`).
- **Single default user.** All endpoints operate against `USER_ID = 1`. The two other seeded users (`Maria`, `Sam`) exist only to populate a non-trivial leaderboard and are never otherwise interacted with.
- **Gems are cosmetic-only.** `users.gems` is seeded to 500 and never decremented or incremented anywhere — it exists purely to render a realistic top bar, per the assignment's explicit "gems can be mocked" allowance.

---

