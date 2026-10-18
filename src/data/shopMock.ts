// MOCK shop catalog. Items come from the sprite files in /public/sprites/avatar/{hat,accessory,outfit}/.
// Prices follow Figma "Shop Grid" frames 95:541 / 95:542 / 95:543. Descriptions and tags are placeholders.
// Replace with the `cosmetics` table once Katie's useShop hook exists (see src/pages/Shop.tsx).

export type ShopCategory = 'hats' | 'accessories' | 'clothing'
export type ShopSlot = 'hat' | 'accessory' | 'outfit'

export interface ShopItem {
  /** Sprite id, also the value stored in avatar.hat / avatar.accessory / avatar.outfit. */
  id: string
  category: ShopCategory
  slot: ShopSlot
  name: string
  price: number
  tag: string
  description: string
}

export const SLOT_BY_CATEGORY: Record<ShopCategory, ShopSlot> = {
  hats: 'hat',
  accessories: 'accessory',
  clothing: 'outfit',
}

export const spriteSrc = (item: Pick<ShopItem, 'slot' | 'id'>) => `/sprites/avatar/${item.slot}/${item.id}.png`

type Seed = [id: string, name: string, price: number, tag: string, description: string]

const make = (category: ShopCategory, seeds: Seed[]): ShopItem[] =>
  seeds.map(([id, name, price, tag, description]) => ({
    id,
    category,
    slot: SLOT_BY_CATEGORY[category],
    name,
    price,
    tag,
    description,
  }))

// Order matches the Figma grids, left to right, top to bottom.
export const MOCK_SHOP_ITEMS: ShopItem[] = [
  ...make('hats', [
    ['gator', 'Gator hat', 150, 'Mascot', 'Scales on, teeth out. Albert would approve.'],
    ['cowboy', 'Cowboy hat', 150, 'Classic', 'Yeehaw. Perfect for a rodeo or a long walk to class.'],
    ['grad-cap', 'Graduation cap', 150, 'Special', 'Toss it in the air. You earned this one.'],
    ['blue-cap', 'Blue cap', 100, 'Sporty', 'Game day ready, rain or shine.'],
    ['straw', 'Straw hat', 100, 'Summer', 'For long afternoons by the lake.'],
    ['bucket', 'Bucket hat', 100, 'Casual', 'Low effort, high style.'],
    ['beanie', 'Beanie', 50, 'Cozy', 'Warm for those freezing lecture halls.'],
    ['cream-cap', 'Cream cap', 50, 'Casual', 'Clean, simple and goes with everything.'],
    ['red-beanie', 'Red beanie', 50, 'Cozy', 'A little pop of red with a little pom.'],
  ]),
  ...make('accessories', [
    ['heart-glasses', 'Heart glasses', 150, 'Cute', 'See the world through pink hearts.'],
    ['eyepatch', 'Eyepatch', 150, 'Bold', 'Arr. Ready for any treasure hunt.'],
    ['gator-sunglasses', 'Gator shades', 150, 'Mascot', 'Orange and blue, all the way.'],
    ['round-glasses', 'Round glasses', 100, 'Study', 'Looks smart, feels smarter.'],
    ['square-glasses', 'Square glasses', 100, 'Study', 'Sharp frames for sharp ideas.'],
    ['sunglasses', 'Sunglasses', 100, 'Cool', 'Too bright out there. Worth it.'],
    ['face-paint', 'Face paint', 50, 'Game day', 'Show your colors in the stands.'],
    ['blush', 'Blush', 50, 'Cute', 'A soft rosy glow.'],
    ['freckles', 'Freckles', 50, 'Cute', 'Sun-kissed, no sunscreen required.'],
  ]),
  ...make('clothing', [
    ['special-gator-costume', 'Gator costume', 150, 'Mascot', 'Chomp chomp. Instant campus legend.'],
    ['special-astronaut', 'Astronaut suit', 150, 'Special', 'One small step for your Charmling.'],
    ['special-suit', 'Suit', 150, 'Formal', 'Career fair ready.'],
    ['special-black-dress', 'Black dress', 100, 'Formal', 'Simple, sleek and always in style.'],
    ['special-lab-coat', 'Lab coat', 100, 'Study', 'For serious science, or looking like it.'],
    ['special-flannel', 'Flannel', 100, 'Cozy', 'A plaid classic for chilly mornings.'],
    ['special-gym', 'Gym fit', 50, 'Sporty', 'Leg day starts now.'],
    ['special-hawaiian', 'Hawaiian shirt', 50, 'Summer', 'Vacation mode, always on.'],
    ['special-pajamas', 'Pajamas', 50, 'Cozy', 'Class at 8am? Wear these anyway.'],
  ]),
]

/** Ids the mock user already owns, one or two per category so the Owned state shows up. */
export const MOCK_OWNED_IDS = ['bucket', 'cream-cap', 'freckles', 'special-gym']

/** The Figma balance. */
export const MOCK_POINTS = 300
