import type { HairColor, SkinTone } from '../types.ts'

// Skin and hair palettes, in Figma order. Swatch colors come from tokens.css.
export const SKINS: ReadonlyArray<{ id: SkinTone; label: string; color: string }> = [
  { id: 'pale', label: 'Light', color: 'var(--swatch-skin-light)' },
  { id: 'tan', label: 'Medium', color: 'var(--swatch-skin-medium)' },
  { id: 'dark', label: 'Dark', color: 'var(--swatch-skin-dark)' },
]

export const HAIR_COLORS: ReadonlyArray<{ id: HairColor; label: string; color: string }> = [
  { id: 'brown', label: 'Brown', color: 'var(--swatch-hair-brown)' },
  { id: 'black', label: 'Black', color: 'var(--swatch-hair-black)' },
  { id: 'blonde', label: 'Gold', color: 'var(--swatch-hair-gold)' },
  { id: 'red', label: 'Red', color: 'var(--swatch-hair-red)' },
  { id: 'blue', label: 'Blue', color: 'var(--swatch-hair-blue)' },
  { id: 'purple', label: 'Purple', color: 'var(--swatch-hair-purple)' },
  { id: 'pink', label: 'Pink', color: 'var(--swatch-hair-pink)' },
  { id: 'green', label: 'Green', color: 'var(--swatch-hair-green)' },
]

// Hairstyle names from Figma "Closet - Hair", in hair sheet order (style 1 to 12).
export const HAIR_STYLE_NAMES = [
  'Fluffy Mess',
  'Side Sweep',
  'Bowl Cut',
  'Tousled',
  'Soft Bob',
  'Straight',
  'Beach Waves',
  'High Pony',
  'Side Pony',
  'Space Buns',
  'Top Knot',
  'Twin Braids',
] as const
