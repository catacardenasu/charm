// Backup conversation starters for /api/prompt, used when Gemini fails, is
// slow (> 3s) or returns something unusable. A tagged prompt is picked when one
// of its tags appears in the pair's shared interests ("coffee" matches
// "iced coffee"); otherwise a generic one. Prompts the pair already had are skipped.

export interface BackupPrompt {
  text: string
  /** Lowercase keywords matched against shared interests. Empty = generic. */
  tags: string[]
}

export const BACKUP_PROMPTS: BackupPrompt[] = [
  // ─── tagged ──────────────────────────────────────────────────────────────
  { text: "What's the best coffee spot on campus, and what do you order there?", tags: ['coffee', 'cafe', 'tea'] },
  { text: "What's the last thing you got really excited about while thrifting?", tags: ['thrift', 'fashion', 'vintage'] },
  { text: 'What anime would you tell a total beginner to start with?', tags: ['anime', 'manga'] },
  { text: "Which anime character do you think you'd actually be friends with?", tags: ['anime', 'manga'] },
  { text: "What's the most fun board game to bring to a game night?", tags: ['board game', 'games', 'tabletop', 'd&d', 'dnd'] },
  { text: "What's a video game you could replay forever?", tags: ['video game', 'gaming', 'games', 'nintendo', 'esports'] },
  { text: "What's the best trail or outdoor spot you've found near Gainesville?", tags: ['hiking', 'outdoors', 'nature', 'camping'] },
  { text: "Have you seen a gator at Lake Alice yet, and how close did you get?", tags: ['nature', 'outdoors', 'animals', 'hiking'] },
  { text: 'Who is the best Gator athlete to watch right now?', tags: ['gators', 'football', 'basketball', 'sports'] },
  { text: "What's your game day routine before heading to the Swamp?", tags: ['gators', 'football', 'sports'] },
  { text: 'Pickup game or watching from the stands: which one is more you?', tags: ['basketball', 'soccer', 'volleyball', 'sports', 'football'] },
  { text: "What song have you had on repeat this week?", tags: ['music', 'concerts', 'k-pop', 'kpop', 'singing'] },
  { text: "Which artist would you most want to see live in Gainesville?", tags: ['music', 'concerts', 'k-pop', 'kpop'] },
  { text: "What's the first song you learned to play, or wish you could?", tags: ['guitar', 'piano', 'music', 'band', 'drums'] },
  { text: "What's a movie you think everyone should watch at least once?", tags: ['film', 'movies', 'cinema'] },
  { text: "What show are you watching right now that you'd recommend?", tags: ['tv', 'film', 'movies', 'shows'] },
  { text: "What's the best thing you've ever baked, or the biggest baking fail?", tags: ['baking', 'cooking', 'food'] },
  { text: "What's your go-to meal when you're cooking for yourself?", tags: ['cooking', 'food', 'baking'] },
  { text: "Where's the best cheap food near campus?", tags: ['food', 'cooking', 'restaurants'] },
  { text: "What's something you've drawn or made recently that you're proud of?", tags: ['art', 'pixel art', 'drawing', 'painting', 'design'] },
  { text: "What's a book you couldn't put down?", tags: ['reading', 'books', 'writing'] },
  { text: "What's the coolest thing you've built or coded so far?", tags: ['coding', 'programming', 'hackathons', 'computer science', 'tech'] },
  { text: "What's a project you'd build if you had a whole weekend free?", tags: ['robotics', 'coding', 'engineering', 'hackathons', 'tech'] },
  { text: "What's your favorite way to work out when you're busy with classes?", tags: ['gym', 'fitness', 'running', 'yoga', 'lifting'] },
  { text: "What's a place you've traveled to that you'd go back to tomorrow?", tags: ['travel', 'photography'] },
  { text: "What's the best photo you've taken around campus?", tags: ['photography', 'art'] },
  { text: "Which campus club do you think is the most underrated?", tags: ['clubs', 'volunteering', 'leadership'] },
  { text: "What's a dance or move you'd love to finally learn?", tags: ['dance', 'k-pop', 'kpop'] },
  // ─── generic ─────────────────────────────────────────────────────────────
  { text: "What's your favorite spot on campus to hang out between classes?", tags: [] },
  { text: "What's the best class you've taken at UF so far?", tags: [] },
  { text: "If you could add one thing to campus, what would it be?", tags: [] },
  { text: "What's something you're looking forward to this semester?", tags: [] },
  { text: "What's a hobby you've always wanted to try?", tags: [] },
  { text: "What's the most Gainesville thing you've done so far?", tags: [] },
  { text: "Where do you go on campus when you need to focus?", tags: [] },
  { text: "What's a small thing that made your week better?", tags: [] },
  { text: "What's your go-to order at the Reitz?", tags: [] },
  { text: "Early classes or late classes, and why?", tags: [] },
  { text: "What's a skill you picked up in college that surprised you?", tags: [] },
  { text: "If you had a free Saturday in Gainesville, how would you spend it?", tags: [] },
]

const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim()

const pick = <T>(items: T[]): T => items[Math.floor(Math.random() * items.length)]

/** A backup prompt for these shared interests that this pair hasn't had yet. */
export function pickBackupPrompt(sharedInterests: string[], previous: string[]): string {
  const used = new Set(previous.map(normalize))
  const fresh = BACKUP_PROMPTS.filter((p) => !used.has(normalize(p.text)))
  const interests = sharedInterests.map((i) => i.toLowerCase())

  const tagged = fresh.filter((p) => p.tags.some((tag) => interests.some((i) => i.includes(tag))))
  if (tagged.length > 0) return pick(tagged).text

  const generic = fresh.filter((p) => p.tags.length === 0)
  if (generic.length > 0) return pick(generic).text

  if (fresh.length > 0) return pick(fresh).text
  return pick(BACKUP_PROMPTS).text // they've had every one: repeats are fine now
}
