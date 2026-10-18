import { useEffect, useState } from 'react'

const MAX_WIDTH = 90
const MAX_HEIGHT = 52
const MAX_SCALE = 8
const cache = new Map<string, Promise<string | null>>()

/**
 * The avatar part sprites sit on the full 21x31 canvas. For a shop tile, crop to the drawn pixels and
 * scale up by a whole number (nearest neighbour), so a hat fills the tile like in Figma.
 */
/** A region of a sprite sheet, in source pixels. */
export interface SpriteCell {
  x: number
  y: number
  w: number
  h: number
}

function makeThumb(src: string, cell?: SpriteCell): Promise<string | null> {
  return new Promise((resolve) => {
    const image = new Image()
    image.onerror = () => resolve(null)
    image.onload = () => {
      const width = cell?.w ?? image.width
      const height = cell?.h ?? image.height
      const source = document.createElement('canvas')
      source.width = width
      source.height = height
      const ctx = source.getContext('2d')
      if (!ctx) return resolve(null)
      ctx.drawImage(image, cell?.x ?? 0, cell?.y ?? 0, width, height, 0, 0, width, height)
      const { data } = ctx.getImageData(0, 0, width, height)

      let minX = width
      let minY = height
      let maxX = -1
      let maxY = -1
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          if (data[(y * width + x) * 4 + 3] > 0) {
            minX = Math.min(minX, x)
            maxX = Math.max(maxX, x)
            minY = Math.min(minY, y)
            maxY = Math.max(maxY, y)
          }
        }
      }
      if (maxX < 0) return resolve(null)

      const cropW = maxX - minX + 1
      const cropH = maxY - minY + 1
      const scale = Math.max(1, Math.min(MAX_SCALE, Math.floor(MAX_WIDTH / cropW), Math.floor(MAX_HEIGHT / cropH)))
      const out = document.createElement('canvas')
      out.width = cropW * scale
      out.height = cropH * scale
      const outCtx = out.getContext('2d')
      if (!outCtx) return resolve(null)
      outCtx.imageSmoothingEnabled = false
      outCtx.drawImage(source, minX, minY, cropW, cropH, 0, 0, out.width, out.height)
      resolve(out.toDataURL('image/png'))
    }
    image.src = src
  })
}

/** A cropped, integer-scaled version of a part sprite. Undefined until ready (the tile shows no image meanwhile). */
export function useSpriteThumb(src: string, cell?: SpriteCell): string | undefined {
  const [thumb, setThumb] = useState<{ key: string; url: string | null } | null>(null)
  const key = cell ? `${src}#${cell.x},${cell.y},${cell.w},${cell.h}` : src

  useEffect(() => {
    let cancelled = false
    let promise = cache.get(key)
    if (!promise) {
      promise = makeThumb(src, cell)
      cache.set(key, promise)
    }
    promise.then((url) => {
      if (!cancelled) setThumb({ key, url })
    })
    return () => {
      cancelled = true
    }
    // cell is fully described by key
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  // A failed crop falls back to the whole image only for single sprites, not for sheets.
  return thumb?.key === key ? (thumb.url ?? (cell ? undefined : src)) : undefined
}
