import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { PlazaPerson } from '../types.ts'
import { STAGE_HEIGHT, STAGE_WIDTH, type PlazaScene as PlazaSceneConfig, type WalkArea } from '../data/plazas.ts'
import { Avatar } from './Avatar.tsx'
import { StreakFlame } from './ui/index.ts'
import { cx } from './ui/cx.ts'
import styles from './PlazaScene.module.css'

export interface PlazaSceneProps {
  scene: PlazaSceneConfig
  people: PlazaPerson[]
  onSelectPerson: (userId: string) => void
  /** Outlines the walkable ground, for tuning it against the art. */
  debug?: boolean
  className?: string
}

// Avatars are the plaza size (21x31 art pixels at 2x) and stand on their feet point.
const AVATAR_WIDTH = 42
const AVATAR_HEIGHT = 62

// On-screen limits for feet positions, in px: keeps heads and flames out from under the status bar and nav.
const EDGE_X = AVATAR_WIDTH / 2 + 2
const TOP_Y = 130
const BOTTOM_Y = 4

// Walking, in design px (Figma frame units) and ms.
const SPEED = 15 // px per second
const MAX_STEP = 90
const MIN_STEP = 14
const PAUSE_MIN = 1500
const PAUSE_MAX = 6000
const CROSS_CHANCE = 0.18
const TICK = 250

interface Layout {
  width: number
  height: number
  scale: number
  offX: number
  offY: number
}

interface Rect {
  x0: number
  y0: number
  x1: number
  y1: number
}

interface Walker {
  x: number
  y: number
  nextAt: number
  arriveAt: number
}

const rand = (min: number, max: number) => min + Math.random() * (max - min)
const pick = <T,>(items: T[]) => items[Math.floor(Math.random() * items.length)]
const inside = (r: Rect, x: number, y: number) => x >= r.x0 && x <= r.x1 && y >= r.y0 && y <= r.y1
const pointIn = (r: Rect) => ({ x: rand(r.x0, r.x1), y: rand(r.y0, r.y1) })
const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi)

function intersection(a: Rect, b: Rect): Rect | null {
  const r = { x0: Math.max(a.x0, b.x0), y0: Math.max(a.y0, b.y0), x1: Math.min(a.x1, b.x1), y1: Math.min(a.y1, b.y1) }
  return r.x1 >= r.x0 && r.y1 >= r.y0 ? r : null
}

/** The map is scaled to cover the screen. This is the scene's frame space, fitted to the screen size. */
function measure(width: number, height: number): Layout {
  const scale = Math.max(width / STAGE_WIDTH, height / STAGE_HEIGHT)
  return { width, height, scale, offX: (width - STAGE_WIDTH * scale) / 2, offY: (height - STAGE_HEIGHT * scale) / 2 }
}

/** Walkable ground, cut down to the part that's on screen and clear of the status bar and nav. */
function visibleAreas(layout: Layout, walkable: WalkArea[]): Rect[] {
  const { scale, offX, offY, width, height } = layout
  const view: Rect = {
    x0: (EDGE_X - offX) / scale,
    y0: (TOP_Y - offY) / scale,
    x1: (width - EDGE_X - offX) / scale,
    y1: (height - BOTTOM_Y - offY) / scale,
  }
  const rects = walkable.map((a) => ({ x0: a.x, y0: a.y, x1: a.x + a.width, y1: a.y + a.height }))
  const clipped = rects.map((r) => intersection(r, view)).filter((r): r is Rect => r != null && r.x1 - r.x0 >= 1 && r.y1 - r.y0 >= 1)
  return clipped.length > 0 ? clipped : rects
}

function nearestArea(areas: Rect[], x: number, y: number) {
  let best = areas[0]
  let bestDist = Infinity
  for (const r of areas) {
    const d = Math.hypot(clamp(x, r.x0, r.x1) - x, clamp(y, r.y0, r.y1) - y)
    if (d < bestDist) {
      best = r
      bestDist = d
    }
  }
  return best
}

/** Stable 0–1 number from an id, so each avatar's idle bob has its own phase. */
function hash01(id: string) {
  let h = 2166136261
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619)
  return ((h >>> 0) % 1000) / 1000
}

function place(el: HTMLElement | undefined, layout: Layout, x: number, y: number, ms: number) {
  if (!el) return
  const { scale, offX, offY } = layout
  el.style.transition = ms > 0 ? `transform ${ms}ms linear` : 'none'
  el.style.transform = `translate3d(${x * scale + offX - AVATAR_WIDTH / 2}px, ${y * scale + offY - AVATAR_HEIGHT}px, 0)`
  el.style.zIndex = String(Math.round(y))
}

function describe(person: PlazaPerson) {
  if (person.streak_weeks <= 0) return person.nickname
  const weeks = `${person.streak_weeks} week streak`
  return `${person.nickname}, ${weeks}${person.at_risk ? ', Charm them this week to keep it going' : ''}`
}

/**
 * A plaza: the location art with people wandering over open ground.
 * Avatars move with CSS transforms. Their steps are scheduled imperatively (no React renders while they walk),
 * so 20+ avatars stay smooth on a phone.
 */
export function PlazaScene({ scene, people, onSelectPerson, debug = false, className }: PlazaSceneProps) {
  const stageRef = useRef<HTMLDivElement>(null)
  const elements = useRef(new Map<string, HTMLDivElement>())
  const walkers = useRef(new Map<string, Walker>())
  const areas = useRef<Rect[]>([])
  const layoutRef = useRef<Layout | null>(null)
  const [layout, setLayout] = useState<Layout | null>(null)

  useLayoutEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    const update = () => {
      const { width, height } = stage.getBoundingClientRect()
      if (width === 0 || height === 0) return
      setLayout((prev) => (prev && prev.width === width && prev.height === height ? prev : measure(width, height)))
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(stage)
    return () => observer.disconnect()
  }, [])

  // Put everyone on open ground, spread out. Runs again on resize (positions stay, scale changes) and when people change.
  useLayoutEffect(() => {
    if (!layout) return
    layoutRef.current = layout
    areas.current = visibleAreas(layout, scene.walkable)
    const live = walkers.current
    const present = new Set(people.map((p) => p.id))
    for (const id of live.keys()) if (!present.has(id)) live.delete(id)

    const now = performance.now()
    const weights = areas.current.map((r) => (r.x1 - r.x0 + 8) * (r.y1 - r.y0 + 8))
    const total = weights.reduce((a, b) => a + b, 0)
    const randomSpot = () => {
      let roll = Math.random() * total
      const index = weights.findIndex((w) => (roll -= w) <= 0)
      return pointIn(areas.current[Math.max(index, 0)])
    }

    for (const person of people) {
      let walker = live.get(person.id)
      if (walker) {
        const r = nearestArea(areas.current, walker.x, walker.y)
        walker.x = clamp(walker.x, r.x0, r.x1)
        walker.y = clamp(walker.y, r.y0, r.y1)
      } else {
        // Best of a few random spots: the one farthest from everyone placed so far.
        let best = randomSpot()
        let bestGap = -1
        for (let i = 0; i < 6; i++) {
          const spot = randomSpot()
          let gap = Infinity
          for (const other of live.values()) gap = Math.min(gap, Math.hypot(other.x - spot.x, other.y - spot.y))
          if (gap > bestGap) {
            best = spot
            bestGap = gap
          }
        }
        walker = { x: best.x, y: best.y, nextAt: now + rand(0, PAUSE_MAX), arriveAt: 0 }
        live.set(person.id, walker)
      }
      const el = elements.current.get(person.id)
      el?.removeAttribute('data-walking')
      place(el, layout, walker.x, walker.y, 0)
    }
  }, [layout, people, scene.walkable])

  // One timer for the whole plaza. Each avatar takes a step when its pause is over.
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const step = (id: string, walker: Walker, now: number) => {
      const layout = layoutRef.current
      const rects = areas.current
      const el = elements.current.get(id)
      if (!layout || rects.length === 0 || !el) return

      const here = rects.filter((r) => inside(r, walker.x, walker.y))
      const current = here.length > 0 ? pick(here) : nearestArea(rects, walker.x, walker.y)

      let target: { x: number; y: number } | null = null
      if (here.length > 0 && Math.random() < CROSS_CHANCE) {
        // Walk to where this ground meets the next piece, so the next step can go on from there.
        const links = rects.map((r) => (r !== current ? intersection(current, r) : null)).filter((r): r is Rect => r != null)
        if (links.length > 0) target = pointIn(pick(links))
      }
      if (!target) {
        const spot = pointIn(current)
        const dist = Math.hypot(spot.x - walker.x, spot.y - walker.y)
        const k = dist > MAX_STEP ? MAX_STEP / dist : 1
        target = { x: walker.x + (spot.x - walker.x) * k, y: walker.y + (spot.y - walker.y) * k }
      }

      const dist = Math.hypot(target.x - walker.x, target.y - walker.y)
      if (dist < MIN_STEP) {
        walker.nextAt = now + rand(PAUSE_MIN, PAUSE_MAX)
        return
      }
      const ms = (dist / SPEED) * 1000
      walker.x = target.x
      walker.y = target.y
      walker.arriveAt = now + ms
      walker.nextAt = now + ms + rand(PAUSE_MIN, PAUSE_MAX)
      el.setAttribute('data-walking', '')
      place(el, layout, target.x, target.y, ms)
    }

    const timer = window.setInterval(() => {
      if (document.hidden) return
      const now = performance.now()
      for (const [id, walker] of walkers.current) {
        if (walker.arriveAt && now >= walker.arriveAt) {
          walker.arriveAt = 0
          elements.current.get(id)?.removeAttribute('data-walking')
        }
        if (now >= walker.nextAt && walker.arriveAt === 0) step(id, walker, now)
      }
    }, TICK)
    return () => window.clearInterval(timer)
  }, [])

  return (
    <div ref={stageRef} className={cx(styles.stage, layout && styles.ready, className)}>
      {layout && (
        <div
          className={styles.art}
          style={{
            width: STAGE_WIDTH,
            height: STAGE_HEIGHT,
            transform: `translate(${layout.offX}px, ${layout.offY}px) scale(${layout.scale})`,
          }}
        >
          {scene.layers.map((layer, i) => (
            <div
              key={i}
              className={styles.layer}
              style={{ left: layer.x, top: layer.y, width: layer.width, height: layer.height }}
            >
              <img
                className={styles.image}
                src={layer.src}
                alt=""
                draggable={false}
                style={
                  layer.crop && {
                    width: layer.crop.width,
                    height: layer.crop.height,
                    left: layer.crop.x,
                    top: layer.crop.y,
                    objectFit: 'fill',
                  }
                }
              />
            </div>
          ))}
          {debug &&
            scene.walkable.map((a, i) => (
              <div
                key={i}
                className={styles.debug}
                style={{ left: a.x, top: a.y, width: a.width, height: a.height }}
              />
            ))}
        </div>
      )}

      {people.map((person) => (
        <div
          key={person.id}
          ref={(el) => {
            if (el) elements.current.set(person.id, el)
            else elements.current.delete(person.id)
          }}
          className={styles.walker}
        >
          <button type="button" className={styles.person} aria-label={describe(person)} onClick={() => onSelectPerson(person.id)}>
            {person.streak_weeks > 0 && (
              <StreakFlame size="sm" className={cx(styles.flame, person.at_risk && styles.atRisk)} />
            )}
            <span className={styles.figure}>
              <Avatar avatar={person.avatar} size="plaza" idleOffset={hash01(person.id)} />
            </span>
          </button>
        </div>
      ))}
    </div>
  )
}
