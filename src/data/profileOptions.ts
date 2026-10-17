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

// Where the AvatarCreator starts in onboarding.
export const DEFAULT_AVATAR: Avatar = {
  skin: 'pale',
  hairStyle: 1,
  hairColor: 'brown',
  outfit: 'basic-01',
  hat: null,
  accessory: null,
}
