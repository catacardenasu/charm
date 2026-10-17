// Shapes of the Supabase tables and RPC results in CLAUDE.md.
// Field names match the database columns (snake_case). Dates are ISO strings
// as returned by Supabase: `date` columns are 'YYYY-MM-DD', timestamps are full ISO.

/** Auth0 `sub`, e.g. 'google-oauth2|1234'. Not a UUID. */
export type UserId = string

export type CosmeticSlot = 'hair' | 'outfit' | 'accessory' | 'hat'

/** Skin tones, named after the hair sheets in Figma. */
export type SkinTone = 'pale' | 'tan' | 'dark'

export type HairColor = 'brown' | 'black' | 'blonde' | 'red' | 'blue' | 'purple' | 'pink' | 'green'

/**
 * A Charmling. Layers stack base → outfit → hat → accessory.
 * The base (body + skin + hair) is one cell of the hair sheet for skin + hairColor.
 */
export interface Avatar {
  skin: SkinTone
  /** Hairstyle column on the hair sheet, 1–12. */
  hairStyle: number
  hairColor: HairColor
  /** 'basic-01'…'basic-24' or 'special-<name>', e.g. 'special-flannel'. */
  outfit: string | null
  /** e.g. 'gator'. */
  hat: string | null
  /** e.g. 'heart-glasses'. */
  accessory: string | null
}

export interface Profile {
  id: UserId
  nickname: string
  major: string | null
  year: string | null
  interests: string[]
  greeting: string | null
  avatar: Avatar
  points: number
  created_at: string
}

export interface Keychain {
  code: string
  owner_id: UserId | null
  active: boolean
  claimed_at: string | null
}

export interface TapIn {
  id: string
  /** Always user_a < user_b. */
  user_a: UserId
  user_b: UserId
  /** Whose phone did the scan. */
  scanner_id: UserId
  keychain_code: string
  /** America/New_York date. */
  day: string
  prompt: string | null
  removed: boolean
  created_at: string
}

export interface PairStreak {
  user_a: UserId
  user_b: UserId
  /** Current streak length in weeks. */
  weeks: number
  /** Monday of the last week they tapped in. */
  last_week: string
  last_day: string
  first_met: string
}

export interface Location {
  id: string
  name: string
  /** Unique people met required to unlock. */
  unlock_at: number
  sort: number
}

export interface Cosmetic {
  id: string
  slot: CosmeticSlot
  name: string
  price: number
  sprite: string
}

export type TapInStatus = 'ok' | 'already_today'

/** What rpc('tap_in', { code }) returns. On 'already_today', points_earned is 0 and nothing unlocks. */
export interface TapInResult {
  status: TapInStatus
  other: Profile
  shared_interests: string[]
  streak_weeks: number
  points_earned: number
  newly_unlocked: Location[]
}
