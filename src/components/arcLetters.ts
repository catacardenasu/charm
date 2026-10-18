// Letters for the curved titles, from the Figma frames ("Meeting Somone", "Seeing you", "Log In Screen").
// x and y are each letter's center in em (the titles are 64px in a 402px frame); rotate is in degrees.
// The "already" letters are laid out on the same upper circle (and a wider lower one) with the same math, not read from Figma.
// Both tap in titles share one "charm'd to" arc. Coordinates are relative to the top of the title block.

export interface ArcLetter {
  char: string
  x: number
  y: number
  rotate: number
}

export const MEET_UPPER: ArcLetter[] = [
  { char: 'c', x: 0.8543, y: 1.5561, rotate: -44.06 },
  { char: 'h', x: 1.3106, y: 1.1915, rotate: -33.16 },
  { char: 'a', x: 1.8431, y: 0.9137, rotate: -21.95 },
  { char: 'r', x: 2.3540, y: 0.7578, rotate: -11.99 },
  { char: 'm', x: 2.9593, y: 0.6909, rotate: -0.62 },
  { char: "’", x: 3.4919, y: 0.7314, rotate: 9.34 },
  { char: 'd', x: 3.9381, y: 0.8396, rotate: 17.9 },
  { char: ' ', x: 4.3633, y: 1.0131, rotate: 26.47 },
  { char: 't', x: 4.7027, y: 1.2100, rotate: 33.79 },
  { char: 'o', x: 5.1191, y: 1.5444, rotate: 43.75 },
]

export const MEET_LOWER: ArcLetter[] = [
  { char: 'm', x: 1.2661, y: 4.5254, rotate: 35.7 },
  { char: 'e', x: 1.7746, y: 4.8169, rotate: 23.97 },
  { char: 'e', x: 2.2538, y: 4.9814, rotate: 13.94 },
  { char: 't', x: 2.7106, y: 5.0568, rotate: 4.84 },
  { char: ' ', x: 3.0620, y: 5.0654, rotate: -2.05 },
  { char: 'y', x: 3.4707, y: 5.0219, rotate: -10.12 },
  { char: 'o', x: 3.9883, y: 4.8791, rotate: -20.72 },
  { char: 'u', x: 4.4690, y: 4.6442, rotate: -31.38 },
  { char: '!', x: 4.8009, y: 4.4077, rotate: -39.59 },
]

export const SEE_LOWER: ArcLetter[] = [
  { char: 's', x: 1.5269, y: 4.6313, rotate: 20.49 },
  { char: 'e', x: 2.0268, y: 4.7854, rotate: 13.79 },
  { char: 'e', x: 2.5265, y: 4.8783, rotate: 7.28 },
  { char: ' ', x: 2.9213, y: 4.9110, rotate: 2.2 },
  { char: 'y', x: 3.3325, y: 4.9080, rotate: -3.06 },
  { char: 'o', x: 3.8672, y: 4.8470, rotate: -9.96 },
  { char: 'u', x: 4.3906, y: 4.7222, rotate: -16.85 },
  { char: '!', x: 4.7783, y: 4.5850, rotate: -22.12 },
]

export const ALREADY_UPPER: ArcLetter[] = [
  { char: 'a', x: 1.4569, y: 1.1019, rotate: -29.96 },
  { char: 'l', x: 1.8898, y: 0.8957, rotate: -20.97 },
  { char: 'r', x: 2.3497, y: 0.7597, rotate: -11.98 },
  { char: 'e', x: 2.9050, y: 0.6940, rotate: -1.50 },
  { char: 'a', x: 3.4630, y: 0.7306, rotate: 8.99 },
  { char: 'd', x: 4.0051, y: 0.8680, rotate: 19.47 },
  { char: 'y', x: 4.5131, y: 1.1019, rotate: 29.96 },
]

export const ALREADY_LOWER: ArcLetter[] = [
  { char: 'c', x: 0.0691, y: 4.1295, rotate: 35.32 },
  { char: 'h', x: 0.4943, y: 4.3997, rotate: 29.55 },
  { char: 'a', x: 0.9445, y: 4.6258, rotate: 23.77 },
  { char: 'r', x: 1.4152, y: 4.8054, rotate: 18.00 },
  { char: 'm', x: 1.9280, y: 4.9423, rotate: 11.91 },
  { char: "’", x: 2.3808, y: 5.0163, rotate: 6.65 },
  { char: 'd', x: 2.8115, y: 5.0478, rotate: 1.70 },
  { char: ' ', x: 3.2658, y: 5.0406, rotate: -3.51 },
  { char: 't', x: 3.6909, y: 4.9963, rotate: -8.41 },
  { char: 'o', x: 4.1587, y: 4.9042, rotate: -13.87 },
  { char: 'd', x: 4.6411, y: 4.7589, rotate: -19.65 },
  { char: 'a', x: 5.1064, y: 4.5658, rotate: -25.42 },
  { char: 'y', x: 5.5500, y: 4.3269, rotate: -31.20 },
  { char: '!', x: 5.9094, y: 4.0875, rotate: -36.15 },
]

export const WORDMARK: ArcLetter[] = [
  { char: 'C', x: 1.9963, y: 0.8557, rotate: -25.52 },
  { char: 'h', x: 2.5627, y: 0.6522, rotate: -14.02 },
  { char: 'a', x: 3.1579, y: 0.5658, rotate: -2.51 },
  { char: 'r', x: 3.6924, y: 0.5901, rotate: 7.71 },
  { char: 'm', x: 4.2854, y: 0.7329, rotate: 19.38 },
]
