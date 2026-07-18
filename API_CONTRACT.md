# API_CONTRACT.md
Single source of truth for DB schema + API shapes. Every track (backend, path UI, lesson player, profile/leaderboard) builds against THIS document. Do not invent extra fields — if something's missing, add it here first, then build.

---

## 0. Conventions

- Base URL (dev): `http://localhost:8000/api`
- All responses: `application/json`
- Single hardcoded learner for now: `user_id = 1` (no real auth). Every endpoint below implicitly operates on user_id=1 unless stated.
- IDs: integers, auto-increment.
- Dates: ISO 8601 strings (`"2026-07-18"` for dates, `"2026-07-18T10:30:00Z"` for datetimes).
- Errors: `{ "error": "message" }` with appropriate HTTP status (400/404/409).
- To make streak/day logic testable without waiting 24h, backend exposes a debug endpoint to advance the simulated "current day" (see 3.7).

---

## 1. Database Schema

### users
| field | type | notes |
|---|---|---|
| id | int PK | |
| name | string | e.g. "Learner" |
| xp_total | int | default 0 |
| gems | int | default 500 (mocked currency) |
| hearts | int | default 5, max 5 |
| last_heart_lost_at | datetime, nullable | used for regen calc |
| streak_count | int | default 0 |
| last_active_date | date, nullable | date of last completed lesson |
| daily_xp_goal | int | default 20 |
| created_at | datetime | |

### courses
| field | type | notes |
|---|---|---|
| id | int PK | |
| title | string | e.g. "Spanish" |
| language_code | string | e.g. "es" |

### units
| field | type | notes |
|---|---|---|
| id | int PK | |
| course_id | int FK -> courses.id | |
| title | string | e.g. "Unit 1: Basics" |
| order_index | int | display order |

### skills
| field | type | notes |
|---|---|---|
| id | int PK | |
| unit_id | int FK -> units.id | |
| title | string | e.g. "Greetings" |
| icon | string | icon key/emoji for now |
| order_index | int | position within unit / on path |
| max_crowns | int | default 5 (levels of mastery) |

### lessons
| field | type | notes |
|---|---|---|
| id | int PK | |
| skill_id | int FK -> skills.id | |
| order_index | int | which lesson # within the skill (crown level) |

### exercises
| field | type | notes |
|---|---|---|
| id | int PK | |
| lesson_id | int FK -> lessons.id | |
| order_index | int | position within lesson |
| type | enum string | `multiple_choice` \| `translate_tap` \| `match_pairs` \| `fill_blank` \| `type_answer` |
| prompt | string | question/instruction text |
| data | JSON (text column) | shape depends on `type` — see 1a below |
| correct_answer | JSON (text column) | shape depends on `type` |

**1a. `data` / `correct_answer` shapes per exercise type:**

- `multiple_choice`
  `data`: `{ "options": ["Hola", "Adiós", "Gracias", "Por favor"] }`
  `correct_answer`: `{ "index": 0 }`

- `translate_tap` (word bank / tap-the-words)
  `data`: `{ "word_bank": ["I", "eat", "apple", "an", "run"] }`
  `correct_answer`: `{ "sequence": ["I", "eat", "an", "apple"] }`

- `match_pairs`
  `data`: `{ "pairs": [{"left": "Hola", "right": "Hello"}, {"left": "Gato", "right": "Cat"}] }`
  `correct_answer`: `{ "map": {"Hola": "Hello", "Gato": "Cat"} }`
  **Interaction model (matches real Duolingo):** left/right tiles are shuffled and shown together. User taps one left tile then one right tile. Each tap-pair is checked IMMEDIATELY — not batched — via its own call to `POST /lessons/{lesson_id}/answer` with `answer: {"left": "Hola", "right": "Hello"}`. A correct pair locks in green and is removed from play; a wrong pair flashes red, un-selects, and costs a heart (same `hearts_remaining` field in the response). The exercise is only "done" once all pairs are matched — so a single `match_pairs` exercise may fire multiple `/answer` calls before moving to the next exercise. Frontend must track which pairs are already locked client-side.

- `fill_blank`
  `data`: `{ "sentence": "Yo ___ una manzana.", "options": ["como", "comes", "comen"] }`
  `correct_answer`: `{ "value": "como" }`

- `type_answer`
  `data`: `{ "prompt_translation_hint": "Type in Spanish: Good morning" }`
  `correct_answer`: `{ "accepted": ["Buenos días", "buenos dias"] }`

### user_skill_progress
| field | type | notes |
|---|---|---|
| id | int PK | |
| user_id | int FK | |
| skill_id | int FK | |
| crowns_earned | int | default 0 |
| status | enum string | `locked` \| `available` \| `completed` (completed = crowns_earned >= max_crowns) |
| last_practiced_at | datetime, nullable | |

### lesson_attempts
| field | type | notes |
|---|---|---|
| id | int PK | |
| user_id | int FK | |
| lesson_id | int FK | |
| started_at | datetime | |
| completed_at | datetime, nullable | |
| xp_earned | int | |
| hearts_lost | int | |
| passed | bool | |

### achievements
| field | type | notes |
|---|---|---|
| id | int PK | |
| code | string | e.g. `streak_7`, `xp_100` |
| title | string | e.g. "7 Day Streak" |
| description | string | |
| icon | string | |

### user_achievements
| field | type | notes |
|---|---|---|
| id | int PK | |
| user_id | int FK | |
| achievement_id | int FK | |
| earned_at | datetime | |

**Relationships:** courses 1—N units 1—N skills 1—N lessons 1—N exercises. users N—N skills via user_skill_progress. users 1—N lesson_attempts. users N—N achievements via user_achievements.

---

## 2. Frontend TypeScript types (mirror the JSON below exactly)

```ts
type ExerciseType = "multiple_choice" | "translate_tap" | "match_pairs" | "fill_blank" | "type_answer";

interface Exercise {
  id: number;
  type: ExerciseType;
  prompt: string;
  data: Record<string, any>; // shape per type, see 1a
}

interface SkillNode {
  id: number;
  title: string;
  icon: string;
  order_index: number;
  status: "locked" | "available" | "completed";
  crowns_earned: number;
  max_crowns: number;
}

interface UnitBlock {
  id: number;
  title: string;
  skills: SkillNode[];
}
```

---

## 3. Endpoints

### 3.1 `GET /path`
Returns the full learning path for user 1, plus top-bar stats.

Response:
```json
{
  "user": {
    "xp_total": 240,
    "streak_count": 5,
    "hearts": 4,
    "gems": 500,
    "daily_xp_goal": 20,
    "xp_today": 10
  },
  "units": [
    {
      "id": 1,
      "title": "Unit 1: Basics",
      "skills": [
        {
          "id": 1, "title": "Greetings", "icon": "👋",
          "order_index": 0, "status": "completed",
          "crowns_earned": 5, "max_crowns": 5
        },
        {
          "id": 2, "title": "Food", "icon": "🍎",
          "order_index": 1, "status": "available",
          "crowns_earned": 2, "max_crowns": 5
        }
      ]
    }
  ]
}
```

### 3.2 `GET /skills/{skill_id}/lesson`
Returns the next lesson to play for that skill (backend picks based on crowns_earned).

Response:
```json
{
  "lesson_id": 7,
  "skill_id": 2,
  "exercises": [
    { "id": 101, "type": "multiple_choice", "prompt": "Select the correct translation",
      "data": { "options": ["Hola", "Adiós", "Gracias", "Por favor"] } },
    { "id": 102, "type": "translate_tap", "prompt": "Translate this sentence",
      "data": { "word_bank": ["I", "eat", "an", "apple", "run"] } }
  ]
}
```
Note: `correct_answer` is NEVER sent to frontend — checked server-side only (see 3.3).

### 3.3 `POST /lessons/{lesson_id}/answer`
Called after each exercise the user answers, so hearts can be deducted live.

Request:
```json
{ "exercise_id": 101, "answer": { "index": 0 } }
```
Response:
```json
{ "correct": true, "hearts_remaining": 4, "correct_answer": { "index": 0 } }
```
(`correct_answer` included in response always, so frontend can show it on wrong answers.)

**Special case — `match_pairs`:** called once per tapped pair, not once per exercise. Request: `{ "exercise_id": 103, "answer": {"left": "Hola", "right": "Hello"} }`. Response adds `all_pairs_matched: false` so frontend knows whether to advance to the next exercise yet:
```json
{ "correct": true, "hearts_remaining": 4, "all_pairs_matched": false }
```

### 3.4 `POST /lessons/{lesson_id}/complete`
Called when the lesson sequence ends (whether passed or failed via 0 hearts).

Request:
```json
{ "correct_count": 8, "total_exercises": 10, "hearts_lost": 2 }
```
Response:
```json
{
  "passed": true,
  "xp_earned": 15,
  "new_xp_total": 255,
  "crowns_earned": 3,
  "streak_count": 6,
  "streak_incremented": true,
  "new_achievements": [
    { "code": "xp_100", "title": "Century Club", "icon": "🏅" }
  ]
}
```

### 3.5 `GET /profile`
Response:
```json
{
  "name": "Learner",
  "xp_total": 255,
  "streak_count": 6,
  "hearts": 3,
  "hearts_max": 5,
  "next_heart_in_seconds": 1800,
  "achievements": [
    { "code": "xp_100", "title": "Century Club", "icon": "🏅", "earned_at": "2026-07-17T10:00:00Z" }
  ],
  "achievements_locked": [
    { "code": "streak_30", "title": "Monthly Master", "icon": "🔥" }
  ]
}
```

### 3.6 `GET /leaderboard`
Response:
```json
{
  "current_user_id": 1,
  "entries": [
    { "user_id": 3, "name": "Maria", "xp_total": 410, "rank": 1 },
    { "user_id": 1, "name": "Learner", "xp_total": 255, "rank": 2 },
    { "user_id": 2, "name": "Sam", "xp_total": 190, "rank": 3 }
  ]
}
```

### 3.7 `POST /debug/advance-day` (dev-only, testable streak logic)
Simulates the passage of one day so streak break/continue logic can be tested without waiting.
Response: `{ "simulated_date": "2026-07-19" }`

### 3.8 `POST /hearts/refill` (mocked practice/refill)
Request: `{}`
Response: `{ "hearts": 5 }`

---

## 4. Shared design tokens (frontend-only, but decide now so tracks don't diverge)

```
--color-green: #58CC02      /* primary/correct */
--color-red: #FF4B4B        /* incorrect/hearts */
--color-blue: #1CB0F6       /* links/accents */
--color-yellow: #FFC800     /* streak/gems */
--color-gray-bg: #F7F7F7
--color-dark-bg: #1F2937    /* dark mode */
font-family: "Feather Bold" fallback -> "Nunito", "DIN Round Pro", sans-serif (use Nunito from Google Fonts as the practical stand-in)
border-radius: rounded, chunky (12-16px), thick bottom-border "3D button" style buttons
```

---

## 5. What each track owns

- **Track A (backend):** implements 3.1–3.8 exactly, seed script populates schema in section 1.
- **Track B (path UI):** consumes 3.1, mocks it locally first using the exact JSON in 3.1.
- **Track C (lesson player):** consumes 3.2/3.3/3.4, mocks them locally using exact JSON shapes above. Must handle all 5 exercise `type` values.
- **Track D (profile/leaderboard):** consumes 3.5/3.6.

Nobody invents new fields without updating this file first.
