import { GoogleGenAI } from '@google/genai'
import { createClient } from '@supabase/supabase-js'
import { pickBackupPrompt } from '../src/data/prompts.js'
import { verifyAuth0 } from './_lib/auth.js'

// POST /api/prompt  { tap_in_id }  with "Authorization: Bearer <Auth0 access token>"
// → { prompt }
//
// Picks one conversation starter for a tap in and saves it to tap_ins.prompt.
// Gemini first; the backup bank (src/data/prompts.ts) if Gemini fails, returns
// nothing usable, or takes longer than 3 seconds. Calling it again for the same
// tap in (e.g. from both phones) returns the prompt that was already saved.

/** The current Gemini Flash model. Change it here only. */
const GEMINI_MODEL = 'gemini-3.8-flash'
const GEMINI_TIMEOUT_MS = 3000

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const json = (body: unknown, status = 200) => Response.json(body, { status })

export async function POST(request: Request): Promise<Response> {
  const me = await verifyAuth0(request)
  if (!me) return json({ error: 'not logged in' }, 401)

  let tapInId: unknown
  try {
    tapInId = ((await request.json()) as { tap_in_id?: unknown }).tap_in_id
  } catch {
    return json({ error: 'body must be JSON' }, 400)
  }
  if (typeof tapInId !== 'string' || !UUID.test(tapInId)) {
    return json({ error: 'tap_in_id must be a uuid' }, 400)
  }

  // Service role: bypasses RLS, so every check below matters.
  const db = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data: tapIn, error: tapInError } = await db
    .from('tap_ins')
    .select('id, user_a, user_b, prompt, removed')
    .eq('id', tapInId)
    .maybeSingle()
  if (tapInError) return json({ error: 'database error' }, 500)
  if (!tapIn || tapIn.removed) return json({ error: 'tap in not found' }, 404)
  if (me !== tapIn.user_a && me !== tapIn.user_b) return json({ error: 'not your tap in' }, 403)

  // Already has one: both phones see the same prompt.
  if (tapIn.prompt) return json({ prompt: tapIn.prompt })

  const [profilesRes, previousRes] = await Promise.all([
    db.from('profiles').select('id, interests').in('id', [tapIn.user_a, tapIn.user_b]),
    db
      .from('tap_ins')
      .select('prompt')
      .eq('user_a', tapIn.user_a)
      .eq('user_b', tapIn.user_b)
      .neq('id', tapIn.id)
      .not('prompt', 'is', null),
  ])
  if (profilesRes.error || previousRes.error) return json({ error: 'database error' }, 500)

  const interestsOf = (id: string) =>
    (profilesRes.data.find((p) => p.id === id)?.interests as string[] | null) ?? []
  const shared = sharedInterests(interestsOf(tapIn.user_a), interestsOf(tapIn.user_b))
  const previous = previousRes.data.map((r) => r.prompt as string)

  const fromGemini = await withTimeout(askGemini(shared, previous), GEMINI_TIMEOUT_MS)
  const prompt = (fromGemini && cleanPrompt(fromGemini, previous)) || pickBackupPrompt(shared, previous)

  // Only fill an empty prompt, so two calls at once can't overwrite each other.
  const { data: saved, error: saveError } = await db
    .from('tap_ins')
    .update({ prompt })
    .eq('id', tapIn.id)
    .is('prompt', null)
    .select('prompt')
  if (saveError) return json({ error: 'database error' }, 500)
  if (saved.length > 0) return json({ prompt })

  // The other phone saved one first: return theirs.
  const { data: existing } = await db.from('tap_ins').select('prompt').eq('id', tapIn.id).maybeSingle()
  return json({ prompt: existing?.prompt ?? prompt })
}

// ─── helpers ────────────────────────────────────────────────────────────────

function sharedInterests(a: string[], b: string[]): string[] {
  const theirs = new Set(b.map((i) => i.trim().toLowerCase()))
  return a.filter((i) => theirs.has(i.trim().toLowerCase()))
}

async function askGemini(shared: string[], previous: string[]): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return null

  const ai = new GoogleGenAI({ apiKey })
  const interests = shared.length > 0 ? shared.join(', ') : 'none in common yet'
  const avoid = previous.length > 0 ? previous.map((p) => `- ${p}`).join('\n') : '(none)'

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents:
        `Shared interests: ${interests}\n\n` +
        `Starters this pair already had (do not repeat or rephrase these):\n${avoid}`,
      config: {
        systemInstruction:
          'You write one conversation starter for two college students at the University of Florida ' +
          'who just met through a friend-making app. Reply with exactly one short, friendly sentence ' +
          '(under 20 words), ideally a question about their shared interests or campus life. ' +
          'Never ask for contact info, socials, where someone lives, or other personal details. ' +
          'Nothing romantic, flirty or sexual: this is not a dating app. ' +
          'Reply with only the sentence, no quotes or extra text.',
        temperature: 1,
      },
    })
    return response.text ?? null
  } catch {
    return null
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<null>((resolve) => {
    timer = setTimeout(() => resolve(null), ms)
  })
  return Promise.race([promise.catch(() => null), timeout]).finally(() => clearTimeout(timer))
}

// Words that mean the prompt is personal, contact-seeking or romantic.
const BLOCKED =
  /\b(phone|number|text me|call me|insta(gram)?|snap(chat)?|tiktok|twitter|discord|social media|socials|e-?mail|address|where (do )?you live|dorm room|apartment|date|dating|crush|boyfriend|girlfriend|partner|romantic|kiss|cute|hot|sexy|flirt|hook ?up|single|relationship|age|how old)\b/i

const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim()

/** Returns a safe, single-sentence prompt, or null if Gemini's output doesn't pass. */
function cleanPrompt(raw: string, previous: string[]): string | null {
  const text = raw
    .trim()
    .replace(/^["'“”‘’\s]+|["'“”‘’\s]+$/g, '')
    .replace(/\s+/g, ' ')

  if (text.length < 10 || text.length > 160) return null
  // One sentence: no sentence break followed by more text.
  if (/[.?!]\s+\S/.test(text)) return null
  if (BLOCKED.test(text)) return null
  if (previous.some((p) => normalize(p) === normalize(text))) return null
  return text
}
