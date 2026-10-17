import type { Avatar } from '../types.ts'

// Placeholder: lists the layers until the sprite stack (skin → outfit → hair → accessory → item,
// pixelated, integer scaling) is built from /public/sprites/.
export default function AvatarView({ avatar, name }: { avatar: Avatar; name?: string }) {
  const layers = [avatar.skin, avatar.outfit, avatar.hair, avatar.accessory, avatar.item].filter(Boolean)
  return (
    <figure data-avatar>
      <div>[avatar: {layers.join(', ')}]</div>
      {name && <figcaption>{name}</figcaption>}
    </figure>
  )
}
