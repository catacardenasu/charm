# Charm

Charm is a friend-making game for college students, built at SwampHacks XII (UF). Every user has an NFC keychain and a pixel avatar. You tap your keychain on someone's phone, Charm opens on their phone with both avatars, shared interests, and a conversation prompt, and the connection is saved for both of you. The people you meet wander around your plaza. Tapping in with the same person at least once every week keeps a streak going.

**Demo target: iPhone Safari only.** Every decision should work there first.

## Git workflow
- Branches: `cata`, `katie`, `naty`. Each person works on their own branch and merges into `main` through small, frequent PRs. `main` is what Vercel deploys to production.
- Before starting work, pull `main` into your branch. Keep changes scoped to the feature you're on to avoid conflicts.
- Figma is the source of truth for UI.

## Stack
- **Frontend:** React + TypeScript + Vite, React Router, `vite-plugin-pwa` (installable PWA, no app store)
- **Auth:** Auth0 SPA (`@auth0/auth0-react`), Google login, **redirect only** (`loginWithRedirect`; never popups, since iOS blocks them)
- **Database:** Supabase (Postgres, Realtime, Storage), connected to Auth0 through **Supabase Third-Party Auth**
- **AI prompts:** Gemini Flash via `@google/genai`, called **only** from the `/api` serverless functions
- **Hosting:** Vercel (auto-deploys on push to `main`); `/api/*.ts` are Vercel serverless functions
- **Server token checks:** `jose` verifies Auth0 access tokens in `/api` against `https://${AUTH0_DOMAIN}/.well-known/jwks.json`

## Environment variables
Browser-visible (`VITE_` prefix, safe to expose):
`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (publishable key), `VITE_AUTH0_DOMAIN`, `VITE_AUTH0_CLIENT_ID`, `VITE_AUTH0_AUDIENCE` (= `https://api.charm`)

Server-only (only read inside `/api`, **never** prefix with `VITE_`, never import into `src/`):
`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `AUTH0_DOMAIN`, `GEMINI_API_KEY`

Never commit `.env.local`. Never log keys or tokens.

## Auth: how Auth0 and Supabase fit together
- `Auth0Provider` uses `authorizationParams: { audience: VITE_AUTH0_AUDIENCE, redirect_uri: window.location.origin }`, `useRefreshTokens: true`, `cacheLocation: 'localstorage'` (keeps iPhone Safari users logged in).
- An Auth0 post-login Action adds `role: 'authenticated'` to the access token, which Supabase requires.
- The Supabase client gets its token from Auth0:
  ```ts
  createClient(url, anonKey, { accessToken: async () => await getAccessTokenSilently() })
  ```
  Do not use `supabase.auth.signIn*`. Auth0 owns login.
- **User IDs are Auth0 `sub` strings** (e.g. `google-oauth2|1234`), **not UUIDs**. All user ID columns are `text`. In SQL and RLS, get the current user with `auth.jwt()->>'sub'`. **Never use `auth.uid()`**, since it casts to uuid and breaks with Auth0.
- On return from login, use Auth0 `appState.returnTo` to send the user back to where they started (e.g. `/k/x7f3q9`).

## Keychains and URLs
- Each keychain stores `https://<PRODUCTION_URL>/k/<code>`, where the code is random (8+ chars, base62). Currently the Vercel production URL; may move to a custom domain later.
- `vercel.json` rewrites every path except `/api/` to `/index.html`, so `/k/:code` works on direct load.
- NFC links open in **Safari, not the installed PWA**, and the two don't share storage. The whole `/k/:code` flow must work fully in Safari.
- iPhone must be unlocked; a notification pops up to open the link.

### `/k/:code` decision tree
1. Not logged in: `loginWithRedirect({ appState: { returnTo: '/k/' + code } })`. If the keychain owner exists, show a teaser first: "Natalia wants to tap in with you!"
2. Logged in with no profile: onboarding (sign up, then avatar, then greeting), then continue.
3. Keychain is **unclaimed**: "Claim this keychain?" (this is the Link keychain flow).
4. Keychain belongs to **me**: "This is your keychain" plus a link to the plaza.
5. Keychain inactive: "This keychain was deactivated."
6. Otherwise: call `rpc('tap_in', { code })` and show the **tap in screen** (both avatars, shared interests, prompt, streak, points earned, any newly unlocked location).

## Routes
| Route | Screen |
|---|---|
| `/` | Plaza (home) if logged in, landing otherwise |
| `/k/:code` | Tap in / claim keychain (above) |
| `/onboarding` | Sign up (nickname, interests, major, year), then avatar creator, then greeting |
| `/plaza/:locationId?` | Plaza with wandering avatars; location switcher |
| `/u/:userId` | Avatar detail: greeting, shared interests, streak, last prompt, memory photos |
| `/streaks` | All streaks sorted, "tap in this week" warnings |
| `/shop` | Spend points on costumes |
| `/review` | Tap in review: "Maya tapped in with you today" with a remove option |
| `/settings` | Profile, lost keychain (deactivate and link a new one) |

## Data model (Supabase, schema `public`)
RLS is **on for every table**. Write policies with `auth.jwt()->>'sub'`. All app writes that change points, streaks or tap ins go through `security definer` functions, never direct client inserts.

- `profiles`: `id text pk` (Auth0 sub), `nickname`, `major`, `year`, `interests text[]`, `greeting`, `avatar jsonb` (`{skin, hairStyle, hairColor, outfit, hat, accessory}`), `points int default 0`, `created_at`
- `keychains`: `code text pk`, `owner_id text null references profiles`, `active bool default true`, `claimed_at`
- `tap_ins`: `id uuid pk`, `user_a text`, `user_b text` (always `user_a < user_b`), `scanner_id text` (whose phone), `keychain_code text`, `day date`, `prompt text`, `removed bool default false`, `created_at`. **Unique on `(user_a, user_b, day)`**, which enforces the once-a-day rule in the database.
- `pair_streaks`: `user_a`, `user_b` (pk together, ordered), `weeks int` (current streak length in weeks), `last_week date` (Monday of the last week they tapped in), `last_day date`, `first_met date`
- `notifications`: `id`, `user_id text`, `type` (`tap_in`, `streak_warning`, `unlock`), `payload jsonb`, `read bool`, `created_at`. **Realtime is on for this table**, which is how the keychain owner's phone updates instantly.
- `memories`: `id`, `tap_in_id`, `uploader_id`, `storage_path`, `created_at`
- `locations`: `id text pk`, `name`, `unlock_at int` (number of **unique people met** required), `sort`. Seeded with campus landmarks Natalia draws (e.g. Plaza of the Americas = 0, Century Tower, Turlington, a lake scene); final list and thresholds come from the art.
- `cosmetics`: `id`, `slot` (hair/outfit/accessory/hat), `name`, `price int`, `sprite`; `owned_cosmetics`: `user_id`, `cosmetic_id`

Storage bucket `memories` is **private**. Path: `memories/{tap_in_id}/{uploader_id}.jpg`. Only the two people in that tap in can read it (storage RLS); show it with signed URLs. Compress images client-side before upload.

## Game rules
- **The day boundary is America/New_York** (`(now() at time zone 'America/New_York')::date`), not UTC.
- `tap_in(code)` (security definer, one transaction):
  1. The caller must be logged in with a profile. The keychain must exist, be active and be owned, and the owner can't be the caller.
  2. Insert into `tap_ins` with the ordered pair and today's date. On a unique conflict, return `{status: 'already_today', ...}` without awarding anything.
  3. Update `pair_streaks` using `this_week = date_trunc('week', today)` (weeks run Monday–Sunday): if `last_week = this_week`, leave `weeks` unchanged; if `last_week = this_week - 7 days`, increment `weeks`; otherwise set `weeks = 1`. Set `last_week = this_week` and `last_day = today`.
  4. Award points to **both** people: a **first meeting** earns 50; every later tap in (max one per day) earns `10 + 5 * (weeks - 1)`, capped at 50. Keep these as constants in one place so they're easy to tune.
  5. Check whether either user's unique-people count crossed a `locations.unlock_at`, and if so return it as `newly_unlocked`.
  6. Insert a `notifications` row for the keychain owner.
  7. Return the other person's profile, shared interests, streak count, points earned and any unlocks.
- **Points vs. locations:** points reward seeing the *same* people again (spent on costumes). Locations only unlock by meeting *new* people. Users who only re-tap the same friends stay in one plaza.
- **Streaks are weekly, per friend:** tapping in at least once in each calendar week (Mon–Sun, America/New_York) keeps the streak going; missing a whole week resets it. Tap ins are still capped at **one per pair per day**. Extra tap ins in the same week earn points but don't grow the streak.
- **Streak warning:** a streak is "at risk" when `last_week` is last week and the pair hasn't tapped in yet this week ("Tap in by Sunday to keep it going").
- **Removing a tap in** (review): set `removed = true`, reverse the points it awarded, and recompute that pair's streak. Removed tap ins don't count anywhere.
- **Lost keychain:** set `active = false` on the old one; the user claims a new one through `/k/:code`.
- **Anti-farming:** once per pair per day (DB constraint), you can't tap your own keychain, random codes, and tap in review.

## Prompts (`/api/prompt`)
- POST with the Auth0 bearer token. Verify it with `jose`, then load both profiles with the service role key.
- Send Gemini (current Flash model, set as one constant) the shared interests and the pair's previous prompts, asking for **one** short, friendly, campus-appropriate conversation starter that doesn't repeat earlier ones.
- If the call fails, the output is empty, or it takes more than 3s, use the **backup bank** in `src/data/prompts.ts` (prompts tagged by interest plus generic ones), skipping ones this pair has already had.
- Filter the output: one sentence, no personal or contact questions, nothing romantic or sexual. Charm is not a dating app.
- Don't block the tap in on the prompt. Save the tap in first, then fill in the prompt.

## UI and art conventions
- Build screens from Natalia's Figma frames, using the Figma MCP when it's connected. Match spacing, colors and type exactly. Put design tokens (colors, fonts, spacing) in one CSS variables file.
- Pixel art: sprites go in `/public/sprites/`. Avatars are layered PNGs on a shared 21×31 canvas, stacked base → outfit → hat → accessory with absolute positioning, using `image-rendering: pixelated` and integer scaling only. The base (body + skin + hair) comes from the hair sheet for that skin and hair color (`/public/sprites/avatar/base/{skin}-{hairColor}.png`, 12 hairstyles across; top row full body, bottom row head only). Outfits are in `/public/sprites/avatar/outfit/`. Hats, accessories and special fits are in the data model but not drawn until they're exported on the 21×31 canvas. Render avatars with `src/components/Avatar.tsx`.
- Plaza: avatars wander with simple random walks and idle animations (2–4 frames). Use CSS transforms, not canvas, unless there's a performance problem. Streak flames sit above avatars.
- Design mobile-first at 390px width. Respect iOS safe areas (`env(safe-area-inset-*)`).
- Use a pixel font for headings and a readable body font.

## Privacy and safety (judges will ask)
- Nicknames only. No contact info or socials are ever shared in the app.
- No location tracking. The "locations" are unlockable art scenes, not GPS.
- Every tap in with your keychain is visible in review and can be removed.

## Build order
1. Tapping a keychain on a phone loads the right person (`/k/:code`, claim flow, Auth0 login with `returnTo`)
2. Tap ins save to both accounts with the once-a-day rule (`tap_in()`, notifications plus Realtime)
3. Prompts from shared interests, plus the backup bank
4. Plaza with wandering avatars **(steps 1–4 = working demo)**
5. Streaks, points and the streak list
6. Location unlocks, costume shop, memory photos, tap in review

## Working rules for Claude Code
- Write SQL as files in `supabase/sql/` (numbered, e.g. `001_schema.sql`). The team pastes them into the Supabase SQL Editor; there's no migration tooling.
- Every new table gets RLS **and** policies in the same file. Supabase auto-expose and auto-RLS are on.
- Never put secrets in `src/`. Anything that needs the service role key or Gemini lives in `/api`.
- Test on a real iPhone through the **Vercel deploy**, since Auth0 needs HTTPS. Localhost is for laptop testing only.
- After changing Vercel env vars, redeploy.
- Keep changes small and commit often on your own branch; merge to `main` through PRs.
