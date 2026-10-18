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

/** Someone in the plaza you're looking at: a friend with a pair streak, or someone you've met. */
export interface PlazaPerson {
  id: UserId
  nickname: string
  avatar: Avatar
  /** Current pair streak with the viewer, in weeks. 0 = no streak, no flame. */
  streak_weeks: number
  /** Last week's streak that hasn't been kept up yet this week. Shows the dim, flickering flame. */
  at_risk: boolean
  /** From usePlaza (optional so mock data still type-checks). */
  greeting?: string | null
  /** 'YYYY-MM-DD' of the last tap in. From usePlaza. */
  last_met?: string
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
  /** Today's tap in for this pair; sent to /api/prompt. */
  tap_in_id: string
  other: Profile
  shared_interests: string[]
  streak_weeks: number
  points_earned: number
  newly_unlocked: Location[]
}

export type NotificationType = 'tap_in' | 'streak_warning' | 'unlock'

/** A row in `notifications` (named to avoid clashing with the DOM's Notification). */
export interface AppNotification {
  id: string
  user_id: UserId
  type: NotificationType
  payload: Record<string, unknown>
  read: boolean
  created_at: string
}

/** Payload tap_in() writes for the keychain owner. */
export interface TapInNotificationPayload {
  tap_in_id: string
  /** The person who scanned the keychain. */
  from_id: UserId
  from_nickname: string
}

export type KeychainStatus = 'not_found' | 'inactive' | 'unclaimed' | 'mine' | 'owned'

/** The public slice of the owner's profile that keychain_lookup() exposes, even logged out. */
export type KeychainOwner = Pick<Profile, 'nickname' | 'avatar'>

/** What rpc('keychain_lookup', { p_code }) returns (supabase/sql/002_keychains.sql). */
export interface KeychainLookup {
  status: KeychainStatus
  has_profile: boolean
  /** Only present when status is 'mine' or 'owned'. */
  owner?: KeychainOwner
}

/** What rpc('claim_keychain', { p_code }) returns in `status`. */
export type ClaimKeychainStatus =
  | 'claimed'
  | 'no_profile'
  | 'not_found'
  | 'inactive'
  | 'mine'
  | 'owned'
  | 'already_have_one'

/** One row of rpc('my_streaks') (supabase/sql/006_helpers.sql), for /streaks. */
export interface StreakEntry {
  id: UserId
  nickname: string
  avatar: Avatar
  /** Current streak in weeks. 0 once a whole week was missed. */
  weeks: number
  last_week: string
  last_day: string
  first_met: string
  /** Tapped in last week but not yet this week ("tap in by Sunday"). */
  at_risk: boolean
}

/** The public profile fields person_detail() shares with people you've met. */
export type PublicProfile = Pick<Profile, 'id' | 'nickname' | 'avatar' | 'greeting' | 'interests' | 'major' | 'year'>

/** What rpc('person_detail', { p_user_id }) returns, for /u/:userId. Null if you've never met. */
export interface PersonDetail {
  profile: PublicProfile
  shared_interests: string[]
  /** Current streak in weeks. 0 once a whole week was missed. */
  weeks: number
  first_met: string | null
  last_day: string | null
  /** Most recent conversation prompt this pair got. */
  last_prompt: string | null
}

/** What rpc('deactivate_my_keychain', { p_code }) returns in `status`. 'not_yours' also covers unknown codes. */
export type DeactivateKeychainStatus = 'deactivated' | 'already_inactive' | 'not_yours'
