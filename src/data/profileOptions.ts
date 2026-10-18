import type { Avatar } from '../types.ts'

// Interest tags by category, from Figma "Interests" (18:201). Profiles store the tag text,
// so the prompt backup bank (src/data/prompts.ts) should tag prompts with these same strings.
export const INTEREST_CATEGORIES = [
  {
    name: 'Games',
    interests: ['Cozy Games', 'Video Games', 'Nintendo', 'Action', 'Roblox', 'Board Games', 'Fortnite', 'Minecraft', 'RPG', 'Puzzle'],
  },
  {
    name: 'Creative',
    interests: ['Art', 'Drawing', 'Photography', 'Fashion', 'Crafts', 'Writing', 'Animation', 'Knitting'],
  },
  {
    name: 'Music',
    interests: ['Pop', 'Electronic', 'Concerts', 'Hip-Hop', 'Country', 'Indie', 'Rap', 'Spanish'],
  },
  {
    name: 'Entertainment',
    interests: ['Cartoons', 'Rom-Com', 'Movies', 'Reality TV', 'Cooking Shows', 'Documentaries', 'Anime', 'Superheroes', 'Horror'],
  },
  {
    name: 'Sports',
    interests: ['Football', 'Soccer', 'Tennis', 'Pickle Ball', 'Running', 'Yoga', 'Basketball', 'Baseball', 'Sports'],
  },
  {
    name: 'Food & Drinks',
    interests: ['Coffee', 'Boba', 'Matcha', 'Food', 'Cooking', 'Baking', 'Brunch', 'Trying New Food', 'Sushi', 'Italian', 'Indian'],
  },
  {
    name: 'Campus',
    interests: ['Study', 'Clubs', 'Greek Life', 'Student Government', 'Volunteer', 'Study Abroad', 'Research', 'Intramural'],
  },
  {
    name: 'Lifestyle',
    interests: ['Skincare', 'Thrifting', 'Pets', 'Plant', 'Shopping', 'Journal', 'Travel', 'Nature', 'Faith', 'Makeup', 'Cars'],
  },
] as const

export const INTERESTS: readonly string[] = INTEREST_CATEGORIES.flatMap((category) => category.interests)

/** "Pick 3 or more" / "12/15 Interests Picked". */
export const MIN_INTERESTS = 3
export const MAX_INTERESTS = 15

export const YEARS = ['1st', '2nd', '3rd', '4th+'] as const

/** "18 out of 30 characters" on the Say hi screen. */
export const GREETING_MAX_LENGTH = 30

// Tappable suggestions on Say hi. Each fits in GREETING_MAX_LENGTH.
export const GREETING_SUGGESTIONS = [
  "I'd drive anywhere for coffee",
  'Find me in Marston!',
  'Ask me about fantasy books',
  'I love SwampHacks!',
  'Lake Alice walks, anyone?',
  'Tell me your go-to boba order',
  'Ask me about my sketchbook',
  'Currently debugging my life',
  'Looking for people to jam with',
  'Go Gators!',
  'Ask me what I am building',
  'Pickleball anyone?',
] as const

// Where the AvatarCreator starts in onboarding.
export const DEFAULT_AVATAR: Avatar = {
  skin: 'pale',
  hairStyle: 1,
  hairColor: 'brown',
  outfit: 'basic-01',
  hat: null,
  accessory: null,
}
