import type { Location, Profile, TapInResult } from '../types.ts'

// Fake data for the /dev gallery and building screens before Supabase is wired up.

export const mockProfiles: Profile[] = [
  {
    id: 'google-oauth2|mock-natalia',
    nickname: 'Natalia',
    major: 'Digital Arts & Sciences',
    year: 'Junior',
    interests: ['pixel art', 'anime', 'coffee', 'thrifting'],
    greeting: 'Ask me about my sketchbook!',
    avatar: { skin: 'tan', hairStyle: 6, hairColor: 'black', outfit: 'basic-05', hat: 'beanie', accessory: 'round-glasses' },
    points: 340,
    created_at: '2026-09-02T14:12:00Z',
  },
  {
    id: 'google-oauth2|mock-maya',
    nickname: 'Maya',
    major: 'Biology',
    year: 'Sophomore',
    interests: ['hiking', 'coffee', 'k-pop', 'volleyball'],
    greeting: 'Always down for a Lake Alice walk.',
    avatar: { skin: 'dark', hairStyle: 8, hairColor: 'brown', outfit: 'basic-12', hat: null, accessory: null },
    points: 120,
    created_at: '2026-09-05T18:40:00Z',
  },
  {
    id: 'google-oauth2|mock-katie',
    nickname: 'Katie',
    major: 'Computer Science',
    year: 'Senior',
    interests: ['hackathons', 'board games', 'anime', 'baking'],
    greeting: 'Currently debugging my life.',
    avatar: { skin: 'pale', hairStyle: 3, hairColor: 'red', outfit: 'basic-01', hat: null, accessory: 'heart-glasses' },
    points: 510,
    created_at: '2026-08-28T09:05:00Z',
  },
  {
    id: 'google-oauth2|mock-jordan',
    nickname: 'Jordan',
    major: 'Sports Management',
    year: 'Freshman',
    interests: ['basketball', 'gators football', 'video games', 'cooking'],
    greeting: 'Go Gators! 🐊',
    avatar: { skin: 'dark', hairStyle: 1, hairColor: 'black', outfit: 'basic-18', hat: 'blue-cap', accessory: null },
    points: 60,
    created_at: '2026-10-01T21:30:00Z',
  },
  {
    id: 'google-oauth2|mock-sam',
    nickname: 'Sam',
    major: 'Music',
    year: 'Junior',
    interests: ['guitar', 'thrifting', 'film', 'coffee'],
    greeting: 'Looking for people to jam with.',
    avatar: { skin: 'pale', hairStyle: 7, hairColor: 'blonde', outfit: 'special-flannel', hat: null, accessory: null },
    points: 225,
    created_at: '2026-09-12T16:00:00Z',
  },
  {
    id: 'google-oauth2|mock-priya',
    nickname: 'Priya',
    major: 'Engineering',
    year: 'Sophomore',
    interests: ['robotics', 'board games', 'hiking', 'baking'],
    greeting: 'Ask me what I am building this week.',
    avatar: { skin: 'tan', hairStyle: 12, hairColor: 'purple', outfit: 'special-lab-coat', hat: null, accessory: 'freckles' },
    points: 180,
    created_at: '2026-09-20T12:45:00Z',
  },
]

export const mockLocations: Location[] = [
  { id: 'plaza', name: 'Plaza of the Americas', unlock_at: 0, sort: 0 },
  { id: 'century-tower', name: 'Century Tower', unlock_at: 3, sort: 1 },
]

/** Natalia tapping in with Maya: second week of their streak, unlocking Century Tower. */
export const mockTapInResult: TapInResult = {
  status: 'ok',
  tap_in_id: '00000000-0000-4000-8000-000000000001',
  other: mockProfiles[1],
  shared_interests: ['coffee'],
  streak_weeks: 2,
  points_earned: 15,
  newly_unlocked: [mockLocations[1]],
}
