# Charm

**Tap a charm, make a friend.** Charm is a friend-making game for college students, built at SwampHacks XII at the University of Florida.

Every user carries an NFC keychain (a "charm") and has a pixel-art Charmling. Tap your charm on someone's phone and Charm opens with both Charmlings, the interests you share, and a conversation starter. The connection is saved for both of you, the people you meet wander around your plaza, and tapping in with the same friend every week keeps your streak alive.

**Live:** https://charm-rho.vercel.app (built for iPhone Safari)

---

## How it works

1. **Tap.** Hold your charm to a friend's unlocked iPhone. The phone reads the tag and opens `charm-rho.vercel.app/k/<code>` in Safari. No app install needed.
2. **Meet.** First time? A teaser shows whose charm it is, then a quick sign-up: about you, interests, build your Charmling, write your line, and optionally link your own charm.
3. **Talk.** The tap in screen shows both Charmlings, your shared interests, and a conversation prompt written by Gemini (with a hand-written backup bank if the AI is slow or down).
4. **Collect.** Everyone you've met lives in your plaza. Meet more new people to unlock new campus plazas.
5. **Keep it going.** Tap in with a friend at least once a week to grow your streak.

## Features

- **NFC tap in** with no app install. Charms are plain NFC tags holding a URL.
- **Onboarding** with a pixel avatar creator and a "Link your charm" step.
- **Plazas:** Plaza of the Americas, Turlington, Lake Alice, Century Tower and The Swamp. Each unlocks after meeting more unique people, and each holds its own group of friends.
- **Weekly streaks** per friend, with "tap in by Sunday" warnings.
- **Points and coins.** Points rank you on the friends leaderboard; coins buy costumes. A first meeting earns 20 points and 10 coins, and each later tap in (max once a day per friend) earns 10 points and 5 coins.
- **Shop and closet** for hats, accessories and outfits.
- **Activity page** with a leaderboard of you and the people you've met, plus your streaks.
- **Charmling profiles** showing shared interests, streak, first meeting and your last prompt.
- **Memories:** an optional photo saved with a tap in, visible only to the two people in it.
- **Tap in review:** see recent tap ins and remove any you didn't want.
- **Installable PWA:** add Charm to your home screen.

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | React 19, TypeScript, Vite, React Router, `vite-plugin-pwa` |
| Auth | Auth0 (Google and email, redirect login) |
| Database | Supabase: Postgres, Row Level Security, Realtime, Storage |
| Auth ↔ DB | Supabase Third-Party Auth trusting Auth0 access tokens |
| AI | Gemini Flash via `@google/genai`, only from a serverless function |
| Hosting | Vercel (static site plus `/api` serverless functions) |
| Design | Figma, with pixel art drawn by the team |

### Technical highlights

- **Rules enforced in the database.** A unique constraint on `(user_a, user_b, day)` makes "one tap in per friend per day" impossible to bypass. Points, coins, streaks and unlocks only change inside `security definer` Postgres functions such as `tap_in()` and `buy_cosmetic()`, never from client writes.
- **Auth0 with Supabase RLS.** Supabase verifies Auth0 JWTs directly. User IDs are Auth0 `sub` strings, and every policy uses `auth.jwt()->>'sub'`.
- **Realtime.** When someone taps your charm, your phone shows the tap in instantly through a Supabase Realtime subscription on `notifications`.
- **Working around iOS.** Safari can't read NFC from a web page, so charms open a URL instead. Linking a new charm during onboarding sets a short-lived flag; tapping the charm opens a new tab that claims it automatically, while the original tab polls until it's linked.
- **AI with a safety net.** `/api/prompt` verifies the Auth0 token, asks Gemini for one friendly, non-repeating starter based on shared interests, filters it, and falls back to a curated bank after 3 seconds or on any error. The tap in is saved first and never waits on the AI.
- **Privacy by design.** Nicknames only, no contact info, no GPS (plazas are art scenes, not locations), private memory photos with signed URLs, and every tap in can be reviewed and removed.

## Project structure

```
api/
  prompt.ts            Gemini conversation prompts (server-only keys)
  _lib/auth.ts         Auth0 token verification with jose
public/
  sprites/             Pixel art: avatar parts, plazas, UI, charm
  icon-*.png           PWA and home screen icons
src/
  pages/               One file per route
  components/          Avatar, plaza, keychain screens, onboarding, shop, ui/
  hooks/               One data hook per need (useTapIn, usePlaza, useShop, ...)
  lib/                 Supabase client, auth, helpers
  data/                Plaza layouts, profile options, backup prompts
  styles/tokens.css    Design tokens from Figma
  types.ts             Types for every table and RPC result
supabase/sql/          Numbered SQL files, run in order
CLAUDE.md              Project rules and conventions for Claude Code
```

## Running locally

**Requirements:** Node.js 20+, plus your own Supabase project, Auth0 tenant and Gemini API key.

```bash
git clone https://github.com/catacardenasu/charm.git
cd charm
npm install
```

Create `.env.local` in the repo root. It's gitignored, so never commit it.

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...
VITE_AUTH0_DOMAIN=your-tenant.us.auth0.com
VITE_AUTH0_CLIENT_ID=...
VITE_AUTH0_AUDIENCE=https://api.charm

# Server-only, used by /api (never prefix with VITE_)
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
AUTH0_DOMAIN=your-tenant.us.auth0.com
GEMINI_API_KEY=...
```

```bash
npm run dev      # http://localhost:5173
npm run build    # type-check and production build
```

`npm run dev` doesn't run the `/api` functions. Use `vercel dev` to test prompts locally, or test on the deployed site.

### Database setup

In the Supabase SQL Editor, run the files in `supabase/sql/` **in order** (`001` through `013`). Each one is safe to re-run. Then turn on Realtime for the `notifications` table if it isn't already.

| File | What it adds |
|---|---|
| `001_schema.sql` | Tables, Row Level Security, grants |
| `002_keychains.sql` | `keychain_lookup`, `claim_keychain` |
| `003_hat_slot.sql` | Migration for the hat cosmetic slot |
| `004_plaza.sql` | Plazas, `my_plaza`, `my_locations` |
| `005_tap_in.sql` | `tap_in(code)`: the core game logic |
| `006_helpers.sql` | Streaks, person detail, deactivate a charm |
| `007_shop.sql` | Cosmetics, buy and equip |
| `008_review.sql` | Recent tap ins, remove a tap in |
| `009_demo_seed.sql` | Demo accounts for presenting |
| `010_leaderboard.sql` | Friends leaderboard |
| `011_coins.sql` | Coins currency and final point values |
| `012_memories.sql` | Private memory photos and Storage policies |
| `013_plaza_groups.sql` | Each plaza holds its own group of friends |

`supabase/sql/dev/` holds helpers for adding and removing fake friends while testing, and `supabase/sql/tests/` holds check queries.

### Auth0 setup

- **Single Page Application** with Allowed Callback URLs, Logout URLs and Web Origins set to your local and deployed URLs. Turn on Refresh Token Rotation.
- **API** with identifier `https://api.charm` (RS256), with user access allowed for the app.
- A **post-login Action** that adds the claim Supabase requires:
  ```js
  exports.onExecutePostLogin = async (event, api) => {
    api.accessToken.setCustomClaim('role', 'authenticated');
  };
  ```
- In Supabase, go to **Authentication → Third-party auth → Auth0** and add your tenant.

### Making charms

Any writable NFC tag (NTAG213/215) works. Get the codes from the `keychains` table, then write `https://<your-domain>/k/<code>` to each tag with an app like NFC Tools. Codes are case-sensitive. Don't lock the tags, so you can rewrite them later.

## Team

Built in one weekend at **SwampHacks XII** by:

- **Cata**: auth, tap in flow, onboarding and linking, app screens
- **Katie**: database, game logic, prompts, shop and memories backend
- **Naty**: design, pixel art, branding, plaza, shop and closet UI

Built with help from Claude Code.
