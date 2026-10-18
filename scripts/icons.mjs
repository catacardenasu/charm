// Generates the PWA and iPhone home screen icons from public/icon-1024.png.
// Run with `npm run icons` after replacing the source art.
import sharp from 'sharp'

const SOURCE = 'public/icon-1024.png'

// Maskable icons get cropped to a circle or squircle; Android keeps the middle 80%.
// The art fills that safe zone and the rest repeats the art's edge pixels (its solid
// background), so the padding always matches whatever color profile the PNG has.
const MASKABLE_SAFE_ZONE = 0.8

async function resize(size, out) {
  await sharp(SOURCE).resize(size, size).png().toFile(out)
  console.log(`${out} (${size}x${size})`)
}

async function maskable(size, out) {
  const inner = Math.round(size * MASKABLE_SAFE_ZONE)
  const pad = Math.round((size - inner) / 2)
  const art = await sharp(SOURCE).resize(inner, inner).toBuffer()
  await sharp(art)
    .extend({ top: pad, bottom: size - inner - pad, left: pad, right: size - inner - pad, extendWith: 'copy' })
    .png()
    .toFile(out)
  console.log(`${out} (${size}x${size}, maskable)`)
}

await resize(192, 'public/icon-192.png')
await resize(512, 'public/icon-512.png')
await maskable(512, 'public/icon-512-maskable.png')
// iOS ignores transparency and rounds the corners itself; the source is opaque.
await resize(180, 'public/apple-touch-icon.png')
