// Art, copy and walkable ground for each plaza. Keyed by `locations.id`.
// All coordinates are in Figma frame space: the plaza frame is 402 wide, and the map runs 784 tall above the nav.

export const STAGE_WIDTH = 402
export const STAGE_HEIGHT = 784

/** A piece of art, placed like its layer in Figma. */
export interface PlazaLayer {
  src: string
  x: number
  y: number
  width: number
  height: number
  /** Crop shown inside the box, for art cut from a larger image (the roof). Defaults to the whole image. */
  crop?: { width: number; height: number; x: number; y: number }
}

/** Open ground: a feet-position rectangle an avatar may stand on. Rectangles that overlap are connected. */
export interface WalkArea {
  x: number
  y: number
  width: number
  height: number
}

export interface PlazaScene {
  description: string
  thumbnail: string
  layers: PlazaLayer[]
  /** Where avatars may walk (paths and grass only). Where two rectangles overlap, avatars can cross over. */
  walkable: WalkArea[]
}

const area = (x0: number, y0: number, x1: number, y1: number): WalkArea => ({
  x: x0,
  y: y0,
  width: x1 - x0,
  height: y1 - y0,
})

const ROOF = '/sprites/plaza/americas-roof.png'
// One roof segment in Figma: 436x88, showing a band of the 436x145 roof image.
const roofSegment = (x: number, y: number): PlazaLayer => ({
  src: ROOF,
  x,
  y,
  width: 436,
  height: 88,
  crop: { width: 436, height: 145.2, x: 0, y: -57.1 },
})

export const PLAZA_SCENES: Record<string, PlazaScene> = {
  'plaza-of-the-americas': {
    description: 'A favorite spot on campus to relax, study outside, and hang out with friends under the trees!',
    thumbnail: '/sprites/plaza/plaza-of-the-americas-thumb.jpg',
    layers: [
      { src: '/sprites/plaza/plaza-of-the-americas.jpg', x: 0, y: 80, width: 402, height: 704 },
      roofSegment(-17, 0),
      roofSegment(-17, 23),
      roofSegment(-10, 46),
      roofSegment(-17, 56),
    ],
    walkable: [
      area(104, 300, 298, 345), // paving below the building, both side paths
      area(145, 270, 262, 385), // brick and paving at the steps
      area(140, 380, 262, 500), // upper lawn
      area(104, 300, 132, 775), // left path
      area(268, 300, 298, 665), // right path
      area(104, 498, 300, 522), // cross path
      area(140, 515, 262, 660), // lower lawn
      area(165, 650, 242, 775), // path to the bottom edge
    ],
  },
  turlington: {
    description: "You can't walk through here without getting handed a flyer or running into someone you know.",
    thumbnail: '/sprites/plaza/turlington-thumb.jpg',
    layers: [{ src: '/sprites/plaza/turlington.jpg', x: -12, y: -97, width: 418, height: 881 }],
    walkable: [
      area(135, 100, 265, 730), // center of the plaza, between the tents
      area(45, 245, 355, 420), // wide band between the two rows of tents
      area(95, 545, 310, 730), // bottom band
    ],
  },
  'lake-alice': {
    description: 'A peaceful spot on campus known for its occasional gator sightings and the bats at sunset.',
    thumbnail: '/sprites/plaza/lake-alice-thumb.jpg',
    layers: [{ src: '/sprites/plaza/lake-alice.jpg', x: -3, y: -3, width: 408, height: 885 }],
    walkable: [
      area(50, 395, 370, 765), // the big lawn below the pond
      area(72, 255, 115, 400), // the bank on the pond's left
    ],
  },
  'century-tower': {
    description: 'One of UF\'s most iconic landmarks, with bells that can be heard across campus throughout the day.',
    thumbnail: '/sprites/plaza/century-tower-thumb.jpg',
    layers: [{ src: '/sprites/plaza/century-tower.jpg', x: 2, y: -81, width: 400, height: 865 }],
    walkable: [
      area(82, 20, 335, 190), // lawn behind the tower
      area(82, 150, 165, 450), // lawn left of the tower
      area(82, 440, 135, 655), // lawn left of the tower steps
      area(278, 150, 335, 655), // lawn right of the tower
      area(82, 545, 395, 655), // lawn in front of the tower
      area(80, 650, 395, 682), // sidewalk along the road
    ],
  },
  'the-swamp': {
    description: 'Where all of Gainesville shows up on game day and the heart of UF pride. Remember to wear orange and blue',
    thumbnail: '/sprites/plaza/the-swamp-thumb.jpg',
    layers: [{ src: '/sprites/plaza/the-swamp.jpg', x: -2, y: -90, width: 404, height: 874 }],
    walkable: [area(28, 52, 376, 688)], // the whole field, end zones included
  },
}

export const DEFAULT_LOCATION_ID = 'plaza-of-the-americas'
