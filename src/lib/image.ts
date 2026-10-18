const MAX_EDGE = 1280
const JPEG_QUALITY = 0.8

function loadImage(file: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Could not read that photo.'))
    }
    image.src = url
  })
}

/**
 * Shrinks a camera photo to a JPEG (long edge 1280px) before upload. iPhone photos are often 4000px+
 * HEIC, so this also converts them to something every browser can show. Safari applies the photo's
 * rotation when drawing, so portrait shots stay upright.
 */
export async function compressImage(file: Blob): Promise<Blob> {
  const image = await loadImage(file)
  const scale = Math.min(1, MAX_EDGE / Math.max(image.naturalWidth, image.naturalHeight))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not prepare that photo.')
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height)

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Could not prepare that photo.'))),
      'image/jpeg',
      JPEG_QUALITY,
    )
  })
}
