import type { Avatar } from '../types.ts'

// Fixed list for the onboarding interest tags. The prompt backup bank
// (src/data/prompts.ts) should tag prompts with these same strings.
export const INTERESTS = [
  'anime',
  'baking',
  'basketball',
  'board games',
  'coffee',
  'cooking',
  'film',
  'gators football',
  'guitar',
  'gym',
  'hackathons',
  'hiking',
  'k-pop',
  'photography',
  'pixel art',
  'reading',
  'robotics',
  'running',
  'thrifting',
  'video games',
  'volleyball',
] as const

export const YEARS = ['Freshman', 'Sophomore', 'Junior', 'Senior', 'Grad'] as const

// Every new user starts with this until Naty's AvatarCreator is in.
export const DEFAULT_AVATAR: Avatar = {
  skin: 'skin-1',
  hair: 'hair-1',
  outfit: 'outfit-1',
  accessory: null,
  item: null,
}
