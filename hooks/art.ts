// Clawd on a log by a campfire in the Omani dunes at night: a 96x32 pixel scene, 48 frames of 250ms (a 12s loop).
// While Claude works Clawd grills a skewer of mishkak; otherwise Clawd just sits by the fire.
// Clawd, the log, the skewer's slope and the 3x3 pieces are sized as in textless's campfire scene.
// One grid per frame feeds both the desktop's SVG and the terminal's half-block cells.

export const W = 96
export const H = 32
export const MIN_W = 60 // Clawd and the fire; narrower terminals crop the palms off the right, then hide it
export const FRAMES = 48
export const FRAME_MS = 250

type Grid = (string | null)[][]

const CLAWD = '#d97757'
const EYE = '#2a1d18'
const STICK = '#d9b380'
const SEAT = { top: '#966640', body: '#784e30', knot: '#5c3a24', end: '#c49668' } // the log Clawd sits on
const FIRE_LOG = ['#6e4a2e', '#5a3a24', '#3a2416']
const FLAME = ['#fff4c2', '#ffd36b', '#ff9f43', '#ea5a32', '#b8372a'] // core to edge
const MEAT = {
  raw: ['#c4483f', '#e8857a', '#8e2f2a'], // body, highlight, shade
  cooking: ['#a65a34', '#cf8550', '#7a3c22'],
  done: ['#6e3a20', '#9a5a30', '#3a1c10'],
}
const SKY = ['#0d1029', '#0d1029', '#121638', '#181c44', '#1f224e', '#282755', '#332c5a', '#40325c', '#4e385c', '#5c3e5a']
const DUNE_FAR = '#3c2e44'
const DUNE = ['#9a7458', '#7a5846', '#5f4338'] // moonlit crest, face, foot
const MOON = '#f3e6b8'
const STAR = '#cfd6ff'
const TRUNK = ['#4f3626', '#3d2a1e']
const PALM: Record<string, string> = { g: '#2f6034', G: '#1f4226', d: '#a0582a' } // fronds, shade, dates

// A date palm's crown, centred on its middle column; the trunk meets it at the bottom row of fronds.
const CROWN = [
  '.......ggggg..ggggg.......',
  '...gggGGGGGggggGGGGGggg...',
  '.ggGGgg....gGGg....ggGGgg.',
  'gGgg......ggGGgg......ggGg',
  'gg.......g.dddd.g.......gg',
  'g........dddddddd........g',
  '..........dddddd..........',
]

// Clawd, 22 x 20 with the arms: as in textless's campfire, eyes toward the right so Clawd watches the fire.
// The right arm is up beside the body, or lowered to hold the skewer.
const CX = 6
const CY = 9
type Eyes = 'open' | 'blink' | 'happy'
const EYES: Record<Eyes, string[]> = {
  open: ['.......ee........ee', '.......ee........ee', '.......ee........ee', '.......ee........ee'],
  blink: ['', '.....eeeeee....eeeeee', '.....eeeeee....eeeeee', ''],
  happy: ['.......ee........ee', '.......ee........ee', '.....ee..ee....ee..ee', '.....ee..ee....ee..ee'],
}
function clawd(g: Grid, eyes: Eyes, holding: boolean, hop: number) {
  const y = CY - hop
  box(g, CX + 2, y, 20, 16, CLAWD)
  box(g, CX, y + 6, 2, 4, CLAWD) // left arm
  box(g, CX + 22, y + (holding ? 9 : 6), 2, 4, CLAWD) // right arm
  for (const x of [4, 8, 14, 18]) box(g, CX + x, y + 16, 2, 4, CLAWD) // legs
  sprite(g, EYES[eyes], CX + 2, y + 4, { e: EYE })
}

// The skewer leaves the lowered hand and rises 11 up for every 14 across, as in textless's campfire.
const STICK_X = CX + 23
const STICK_Y = CY + 12
const stickY = (x: number) => STICK_Y - Math.round(((x - STICK_X) * 11) / 14)
const STICK_END = 53
const CHUNKS = [40, 44, 48, 52] // centre x of each 3x3 piece, the marshmallow's size, a pixel of skewer between

const FIRE_X = 40
// Flame height per column, one row per fire frame.
const FIRE = [
  [2, 3, 5, 6, 8, 9, 11, 10, 12, 11, 9, 10, 8, 7, 5, 3, 2],
  [2, 4, 4, 7, 9, 8, 10, 12, 11, 9, 11, 9, 7, 8, 4, 3, 2],
  [3, 3, 6, 7, 6, 9, 12, 11, 9, 11, 12, 8, 8, 6, 5, 2, 2],
]
// Embers, as in textless's campfire: sparks leave the flames and rise 2 pixels a frame, swaying left and right,
// each on its own 12-frame (3s) loop. Each is x, phase, colour and which way it sways first.
const EMBER_FRAMES = 12
const SWAY = [0, 0, -1, -1, -2, -1, 0, 1, 1, 2, 1, 0]
const EMBERS: [number, number, string, number][] = [
  [44, 0, '#ff9f43', 1], [47, 7, '#ffd36b', -1], [49, 4, '#ff9f43', 1],
  [52, 10, '#ffd36b', -1], [46, 2, '#ffd36b', 1], [50, 5, '#ff9f43', -1],
]
const EMBER_Y = 18
const emberStep = ([, phase, , dir]: (typeof EMBERS)[number], f: number) => {
  const p = (f + phase) % EMBER_FRAMES
  return [dir * SWAY[p], -2 * p]
}

const STARS: [number, number][] = [[3, 1], [14, 4], [22, 1], [31, 6], [40, 2], [47, 5], [36, 0], [9, 7], [58, 3], [63, 8], [71, 1], [26, 9], [52, 10], [78, 4]]

const box = (g: Grid, x: number, y: number, w: number, h: number, c: string) => {
  for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (g[j]?.[i] !== undefined) g[j][i] = c
}
const sprite = (g: Grid, rows: string[], ox: number, oy: number, colours: Record<string, string>) =>
  rows.forEach((row, y) => [...row].forEach((c, x) => { if (colours[c]) box(g, ox + x, oy + y, 1, 1, colours[c]) }))

const duneFar = (x: number) => Math.round(17 + 2.4 * Math.sin(x / 9 + 1) + 1.2 * Math.sin(x / 4))
const duneNear = (x: number) => Math.round(25 + 1.8 * Math.sin(x / 13 + 2.2))

function palm(g: Grid, x: number, top: number, lean: number) {
  for (let y = top + 4; y < H; y++) {
    const tx = x + Math.round((lean * (H - y)) / (H - top))
    box(g, tx, y, 2, 1, TRUNK[y % 2])
  }
  sprite(g, CROWN, x + lean - 12, top, PALM)
}

function scenery(): Grid {
  const g: Grid = Array.from({ length: H }, (_, y) => Array<string | null>(W).fill(SKY[Math.min(Math.floor(y / 2), SKY.length - 1)]))
  for (const [x, y] of STARS) g[y][x] = STAR
  sprite(g, ['.mm', 'm..', 'm..', 'm..', '.mm'], 30, 2, { m: MOON }) // crescent, clear of the faded border
  for (let x = 0; x < W; x++) box(g, x, duneFar(x), 1, H, DUNE_FAR)
  palm(g, 70, 3, 2)
  palm(g, 85, 8, -1)
  for (let x = 0; x < W; x++) {
    const y = duneNear(x)
    box(g, x, y, 1, H, DUNE[2])
    box(g, x, y, 1, 3, DUNE[1])
    g[y][x] = DUNE[0]
  }
  // The log Clawd sits on, 34 x 6: knotted bark, a dark underside, the cut end facing the fire.
  const lx = CX - 4, ly = CY + 16
  box(g, lx, ly, 34, 1, SEAT.top)
  box(g, lx, ly + 1, 34, 4, SEAT.body)
  box(g, lx, ly + 5, 34, 1, SEAT.knot)
  for (const [x, y] of [[8, 0], [21, 0], [2, 1], [15, 1], [28, 1], [9, 2], [22, 2], [3, 3], [16, 3], [29, 3], [10, 4], [23, 4]]) g[ly + y][lx + x] = SEAT.knot
  box(g, lx + 33, ly + 2, 1, 2, SEAT.end)
  // The fire's logs.
  box(g, FIRE_X - 1, 28, 19, 1, FIRE_LOG[0])
  box(g, FIRE_X - 2, 29, 21, 1, FIRE_LOG[1])
  box(g, FIRE_X, 30, 17, 2, FIRE_LOG[2])
  return g
}
const SCENERY = scenery()

export function grid(frame: number, grilling: boolean, embers = true): Grid {
  const f = ((frame % FRAMES) + FRAMES) % FRAMES
  const g = SCENERY.map(row => [...row])
  const eaten = grilling && f >= 44

  // Fire: each column burns from the logs up, red at the tips, orange then yellow deeper in, white only at the
  // heart, darker at the sides.
  FIRE[f % 3].forEach((h, i) => {
    const side = Math.min(i, 16 - i) < 4 ? 1 : 0
    for (let k = 0; k < h; k++) {
      const depth = h - 1 - k
      const heat = depth === 0 ? 3 : depth < 3 ? 2 : depth < 6 || side ? 1 : 0
      g[28 - k][FIRE_X + i] = FLAME[heat + side]
    }
  })

  // The skewer and the four pieces of meat cooking on it, only while Claude works.
  if (grilling) {
    for (let x = STICK_X; x <= STICK_END; x++) g[stickY(x)][x] = STICK
    if (!eaten) {
      const [body, light, shade] = f < 16 ? MEAT.raw : f < 32 ? MEAT.cooking : MEAT.done
      for (const x of CHUNKS) {
        const y = stickY(x)
        box(g, x - 1, y - 1, 3, 3, body); g[y - 1][x - 1] = light; g[y + 1][x + 1] = shade
      }
    }
  }

  // Clawd: blinks now and then; done eating, a happy hop.
  const eyes: Eyes = eaten ? 'happy' : f === 10 || f === 30 ? 'blink' : 'open'
  clawd(g, eyes, grilling, eaten && f % 2 === 0 ? 1 : 0)

  if (embers) for (const e of EMBERS) {
    const [dx, dy] = emberStep(e, f)
    box(g, e[0] + dx, EMBER_Y + dy, 1, 1, e[2])
  }
  return g
}

// Rows of same-colour runs as one path per colour.
function paths(cells: [number, number, string][]): string {
  const by = new Map<string, string>()
  const set = new Set(cells.map(([x, y, c]) => `${x},${y},${c}`))
  for (const [x, y, c] of cells) {
    if (set.has(`${x - 1},${y},${c}`)) continue // not the start of a run
    let w = 1
    while (set.has(`${x + w},${y},${c}`)) w++
    by.set(c, (by.get(c) ?? '') + `M${x} ${y}h${w}v1h-${w}z`)
  }
  return [...by].map(([c, d]) => `<path fill="${c}" d="${d}"/>`).join('')
}

// The whole loop as one SMIL-animated SVG: what never changes drawn once, then one group per distinct
// remainder, shown on the frames that have it.
// The faded border, after textless's campfire but thinner: a rounded frame FADE pixels deep, in campfire's six
// steps of opacity (0 to 1 by 0.2), dithered so the steps break up into pixels instead of bands.
const FADE = 5
export function fade(x: number, y: number, w = W): number {
  const dx = Math.max(0, FADE - Math.min(x + 0.5, w - x - 0.5))
  const dy = Math.max(0, FADE - Math.min(y + 0.5, H - y - 0.5))
  const alpha = Math.max(0, 1 - Math.hypot(dx, dy) / FADE)
  const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453 // a fixed per-pixel noise in [0, 1)
  return Math.min(5, Math.floor(alpha * 5 + n - Math.floor(n))) / 5
}

// scale: 4.375 screen pixels per art pixel, as textless's campfire (560 wide for 128).
export function svg(grilling: boolean, scale = 4.375): string {
  // The embers are left out of the frames and move on their own, as campfire's do, which keeps the file small.
  const grids = Array.from({ length: FRAMES }, (_, f) => grid(f, grilling, false))
  const still: [number, number, string][] = []
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const c = grids[0][y][x]
    if (c && grids.every(g => g[y][x] === c)) still.push([x, y, c])
  }
  const isStill = new Set(still.map(([x, y]) => `${x},${y}`))
  const groups = new Map<string, number[]>()
  grids.forEach((g, f) => {
    const cells: [number, number, string][] = []
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (g[y][x] && !isStill.has(`${x},${y}`)) cells.push([x, y, g[y][x]!])
    const key = paths(cells)
    groups.set(key, [...(groups.get(key) ?? []), f])
  })
  const dur = (FRAMES * FRAME_MS) / 1000
  const keyTimes = Array.from({ length: FRAMES }, (_, f) => (f / FRAMES).toFixed(4)).join(';')
  const layers = [...groups].map(([art, frames]) => {
    const values = Array.from({ length: FRAMES }, (_, f) => (frames.includes(f) ? 1 : 0)).join(';')
    return `<g opacity="${frames.includes(0) ? 1 : 0}"><animate attributeName="opacity" calcMode="discrete" values="${values}" keyTimes="${keyTimes}" dur="${dur}s" repeatCount="indefinite"/>${art}</g>`
  })
  const embers = EMBERS.map(e => {
    const values = Array.from({ length: EMBER_FRAMES }, (_, f) => emberStep(e, f).join(' ')).join(';')
    const times = Array.from({ length: EMBER_FRAMES }, (_, f) => (f / EMBER_FRAMES).toFixed(4)).join(';')
    const loop = (EMBER_FRAMES * FRAME_MS) / 1000
    return `<g><animateTransform attributeName="transform" type="translate" calcMode="discrete" values="${values}" keyTimes="${times}" dur="${loop}s" repeatCount="indefinite"/><path fill="${e[2]}" d="M${e[0]} ${EMBER_Y}h1v1h-1z"/></g>`
  })
  const edge: [number, number, string][] = []
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const a = fade(x, y)
    if (a < 1) edge.push([x, y, `#${Math.round(a * 255).toString(16).padStart(2, '0').repeat(3)}`])
  }
  const mask = `<defs><mask id="fade" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="#fff"/>${paths(edge)}</mask></defs>`
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W * scale}" height="${H * scale}" viewBox="0 0 ${W} ${H}" shape-rendering="crispEdges">${mask}<g mask="url(#fade)">${paths(still)}${layers.join('')}${embers.join('')}</g></svg>`
}

// The terminal's Raster cells: two pixels per cell with ▀/▄, the terminal's own background where there is none.
// The faded border darkens toward black and, at its faintest, lets the terminal's background through.
const DEFAULT = 0x01000000
const rgb = (c: string) => parseInt(c.slice(1), 16)
const dim = (c: number, a: number) => (Math.round(((c >> 16) & 255) * a) << 16) | (Math.round(((c >> 8) & 255) * a) << 8) | Math.round((c & 255) * a)
const faded = (c: string | null, x: number, y: number, w: number) => {
  const a = fade(x, y, w)
  return c && a > 0.2 ? dim(rgb(c), a) : null
}
// `columns` crops the scene from the right, for terminals narrower than W.
export function cells(frame: number, grilling: boolean, columns = W): string {
  const g = grid(frame, grilling)
  const words = new Uint32Array(columns * (H / 2) * 3)
  for (let r = 0; r < H / 2; r++) for (let x = 0; x < columns; x++) {
    const top = faded(g[r * 2][x], x, r * 2, columns), bottom = faded(g[r * 2 + 1][x], x, r * 2 + 1, columns)
    const cell = top !== null ? [0x2580, top, bottom ?? DEFAULT] : bottom !== null ? [0x2584, bottom, DEFAULT] : [0x20, DEFAULT, DEFAULT]
    words.set(cell, (r * columns + x) * 3)
  }
  return new Uint8Array(words.buffer).toBase64()
}
