import type { Avatar, Location, PlazaPerson, Profile, TapInResult } from '../types.ts'

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
    coins: 170,
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
    coins: 60,
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
    coins: 255,
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
    coins: 30,
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
    coins: 112,
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
    coins: 90,
    created_at: '2026-09-20T12:45:00Z',
  },
]

// Unlock counts (unique people met) come from the Figma "Plaza Options Locked" frame.
export const mockLocations: Location[] = [
  { id: 'plaza-of-the-americas', name: 'Plaza of the Americas', unlock_at: 0, sort: 0 },
  { id: 'turlington', name: 'Turlington Plaza', unlock_at: 10, sort: 1 },
  { id: 'lake-alice', name: 'Lake Alice', unlock_at: 25, sort: 2 },
  { id: 'century-tower', name: 'Century Tower', unlock_at: 40, sort: 3 },
  { id: 'the-swamp', name: 'The Swamp', unlock_at: 50, sort: 4 },
]

/** How many different people the mock viewer has met. Unlocks Turlington and Lake Alice. */
export const mockUniquePeopleMet = 27

type PersonSpec = [
  nickname: string,
  skin: Avatar['skin'],
  hairStyle: number,
  hairColor: Avatar['hairColor'],
  outfit: string,
  hat: string | null,
  accessory: string | null,
  streakWeeks: number,
  atRisk?: boolean,
]

// 25 people with varied skin, hair, outfits, hats and accessories, for testing a busy plaza.
const PLAZA_SPECS: PersonSpec[] = [
  ['Maya', 'dark', 8, 'brown', 'basic-12', null, null, 3],
  ['Katie', 'pale', 3, 'red', 'basic-01', null, 'heart-glasses', 8],
  ['Jordan', 'dark', 1, 'black', 'basic-18', 'blue-cap', null, 2, true],
  ['Sam', 'pale', 7, 'blonde', 'special-flannel', null, null, 0],
  ['Priya', 'tan', 12, 'purple', 'special-lab-coat', null, 'freckles', 5],
  ['Ariana', 'tan', 2, 'pink', 'basic-03', null, null, 4],
  ['Blake', 'pale', 5, 'brown', 'basic-07', 'beanie', null, 1, true],
  ['Mike', 'dark', 10, 'black', 'basic-21', null, 'sunglasses', 0],
  ['Luna', 'pale', 9, 'blue', 'basic-14', 'bucket', null, 6],
  ['Devon', 'tan', 4, 'green', 'special-hawaiian', 'straw', null, 0],
  ['Zoe', 'pale', 11, 'pink', 'basic-09', null, 'round-glasses', 2],
  ['Omar', 'tan', 6, 'black', 'basic-23', 'cream-cap', null, 7],
  ['Hannah', 'pale', 12, 'blonde', 'basic-16', null, 'blush', 0],
  ['Theo', 'dark', 3, 'brown', 'special-suit', 'grad-cap', null, 3, true],
  ['Nina', 'tan', 7, 'red', 'basic-05', null, 'square-glasses', 1],
  ['Caleb', 'pale', 1, 'black', 'special-gym', null, null, 0],
  ['Imani', 'dark', 9, 'purple', 'basic-20', 'red-beanie', null, 9],
  ['Wes', 'pale', 8, 'blonde', 'special-pajamas', null, 'eyepatch', 0],
  ['Sofia', 'tan', 2, 'brown', 'basic-11', null, 'face-paint', 2],
  ['Reese', 'dark', 5, 'green', 'basic-02', 'cowboy', null, 0],
  ['Ella', 'pale', 10, 'red', 'basic-24', null, null, 4, true],
  ['Marcus', 'dark', 11, 'black', 'special-astronaut', null, null, 5],
  ['Tess', 'tan', 4, 'blue', 'basic-08', 'gator', 'gator-sunglasses', 3],
  ['Ravi', 'tan', 6, 'brown', 'basic-19', null, 'sunglasses', 0],
  ['June', 'pale', 3, 'purple', 'special-black-dress', null, 'heart-glasses', 1],
]

const mockPlazaPeople: PlazaPerson[] = PLAZA_SPECS.map(
  ([nickname, skin, hairStyle, hairColor, outfit, hat, accessory, streakWeeks, atRisk = false]) => ({
    id: `google-oauth2|mock-${nickname.toLowerCase()}`,
    nickname,
    avatar: { skin, hairStyle, hairColor, outfit, hat, accessory },
    streak_weeks: streakWeeks,
    at_risk: atRisk,
  }),
)

// Each plaza shows a different slice, so switching plazas feels like different crowds.
const PLAZA_CROWDS: Record<string, { offset: number; count: number }> = {
  'plaza-of-the-americas': { offset: 0, count: 25 },
  turlington: { offset: 5, count: 22 },
  'lake-alice': { offset: 11, count: 21 },
  'century-tower': { offset: 17, count: 23 },
  'the-swamp': { offset: 3, count: 24 },
}

const plazaCache = new Map<string, PlazaPerson[]>()

/** Stand-in for usePlaza(locationId). Returns the same array every time for a plaza, so the scene doesn't restart. */
export function mockPlaza(locationId: string): PlazaPerson[] {
  let people = plazaCache.get(locationId)
  if (!people) {
    const { offset, count } = PLAZA_CROWDS[locationId] ?? PLAZA_CROWDS['plaza-of-the-americas']
    people = Array.from({ length: count }, (_, i) => mockPlazaPeople[(offset + i) % mockPlazaPeople.length])
    plazaCache.set(locationId, people)
  }
  return people
}

/** Natalia tapping in with Maya: second week of their streak, unlocking Century Tower. */
export const mockTapInResult: TapInResult = {
  status: 'ok',
  tap_in_id: '00000000-0000-4000-8000-000000000001',
  other: mockProfiles[1],
  shared_interests: ['coffee'],
  streak_weeks: 2,
  points_earned: 10,
  coins_earned: 5,
  newly_unlocked: [mockLocations.find((l) => l.id === 'century-tower')!],
}
