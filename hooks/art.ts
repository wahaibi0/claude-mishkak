// Clawd at a campfire in the Omani dunes at dusk: a 64x20 pixel scene, 48 frames of 250ms (a 12s loop).
// While Claude works Clawd grills a skewer of mishkak; otherwise Clawd just sits by the fire.
// One grid per frame feeds both the desktop's SVG and the terminal's half-block cells.

export const W = 64
export const H = 20
export const FRAMES = 48
export const FRAME_MS = 250

type Grid = (string | null)[][]

const CLAWD = '#d77757'
const EYE = '#1e1b1a'
const STICK = '#d9b380'
const LOG = '#5a3a24'
const LOG_DARK = '#3a2416'
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
  '.....ggg.ggg.....',
  '...ggGGGgGGGgg...',
  '.ggGgg.gGg.ggGgg.',
  'gGg...gGGGg...gGg',
  'g....g.ddd.g....g',
  '.......ddd.......',
]

// Clawd as on Claude Code's welcome screen: 18 x 5, every row drawn twice. Eyes on row 1, arms on row 2.
// The eyes sit toward the right edge, as in textless's campfire, so Clawd looks at the fire rather than out.
const CLAWD_ROWS = (blink: boolean) => [
  '...############...',
  blink ? '...############...' : '...####e#####e#...',
  '.################.',
  '...############...',
  '....#.#....#.#....',
]

// The skewer rises from Clawd's hand over the fire, one pixel up every four across, as in textless's campfire.
const stickY = (x: number) => 12 - Math.floor((x - 18) / 4)
const CHUNKS = [27, 31, 35, 39] // centre x of each 3x3 piece of meat, threaded on the skewer
const FIRE_X = 25
// Flame height per column, one row per fire frame.
const FIRE = [
  [1, 2, 3, 3, 4, 5, 4, 5, 5, 5, 4, 5, 4, 3, 3, 2, 1],
  [1, 2, 2, 4, 5, 4, 5, 5, 5, 4, 5, 4, 3, 4, 2, 2, 1],
  [2, 2, 3, 4, 3, 4, 5, 5, 4, 5, 5, 4, 4, 3, 3, 1, 1],
]
const STARS: [number, number][] = [[3, 1], [14, 3], [22, 1], [31, 4], [40, 2], [47, 5], [36, 0], [9, 5]]

const box = (g: Grid, x: number, y: number, w: number, h: number, c: string) => {
  for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (g[j]?.[i] !== undefined) g[j][i] = c
}
const sprite = (g: Grid, rows: string[], ox: number, oy: number, colours: Record<string, string>) =>
  rows.forEach((row, y) => [...row].forEach((c, x) => { if (colours[c]) box(g, ox + x, oy + y, 1, 1, colours[c]) }))

const duneFar = (x: number) => Math.round(10 + 1.6 * Math.sin(x / 6 + 1) + Math.sin(x / 2.7))
const duneNear = (x: number) => Math.round(14 + 1.4 * Math.sin(x / 9 + 2.2))

function palm(g: Grid, x: number, top: number, lean: number) {
  for (let y = top + 4; y < H; y++) {
    const tx = x + Math.round((lean * (H - y)) / (H - top))
    box(g, tx, y, 2, 1, TRUNK[y % 2])
  }
  sprite(g, CROWN, x + lean - 7, top, PALM)
}

function scenery(): Grid {
  const g: Grid = Array.from({ length: H }, (_, y) => Array<string | null>(W).fill(SKY[Math.min(y, SKY.length - 1)]))
  for (const [x, y] of STARS) g[y][x] = STAR
  sprite(g, ['.mm', 'm..', 'm..', '.mm'], 55, 1, { m: MOON }) // crescent
  for (let x = 0; x < W; x++) box(g, x, duneFar(x), 1, H, DUNE_FAR)
  palm(g, 46, 3, 2)
  palm(g, 56, 5, -1)
  for (let x = 0; x < W; x++) {
    const y = duneNear(x)
    box(g, x, y, 1, H, DUNE[2])
    box(g, x, y, 1, 3, DUNE[1])
    g[y][x] = DUNE[0]
  }
  return g
}
const SCENERY = scenery()

export function grid(frame: number, grilling: boolean): Grid {
  const f = ((frame % FRAMES) + FRAMES) % FRAMES
  const g = SCENERY.map(row => [...row])
  const eaten = grilling && f >= 44

  // Fire: each column burns from the logs up, red at the tips, paler deeper in, darker at the sides.
  FIRE[f % 3].forEach((h, i) => {
    const side = Math.min(i, 16 - i) < 3 ? 1 : 0
    for (let k = 0; k < h; k++) g[17 - k][FIRE_X + i] = FLAME[Math.max(0, 3 - (h - 1 - k)) + side]
  })
  box(g, 24, 18, 19, 1, LOG)
  box(g, 26, 19, 15, 1, LOG_DARK)

  // The skewer from Clawd's arm, and the four pieces of meat cooking on it, only while Claude works.
  if (grilling) {
    for (let x = 18; x <= 40; x++) g[stickY(x)][x] = STICK
    if (!eaten) {
      const [body, light, shade] = f < 16 ? MEAT.raw : f < 32 ? MEAT.cooking : MEAT.done
      for (const x of CHUNKS) {
        const y = stickY(x)
        box(g, x - 1, y - 1, 3, 3, body); g[y - 1][x - 1] = light; g[y + 1][x + 1] = shade
      }
    }
  }

  // Clawd: blinks now and then; done eating, a happy hop with eyes shut.
  const hop = eaten && f % 2 === 0 ? 1 : 0
  const rows = CLAWD_ROWS(eaten || f === 10 || f === 30).flatMap(r => [r, r])
  sprite(g, rows, 1, 8 - hop, { '#': CLAWD, e: EYE })
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
export function svg(grilling: boolean, scale = 6): string {
  const grids = Array.from({ length: FRAMES }, (_, f) => grid(f, grilling))
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
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W * scale}" height="${H * scale}" viewBox="0 0 ${W} ${H}" shape-rendering="crispEdges">${paths(still)}${layers.join('')}</svg>`
}

// The terminal's Raster cells: two pixels per cell with ▀/▄, the terminal's own background where there is none.
const DEFAULT = 0x01000000
const rgb = (c: string) => parseInt(c.slice(1), 16)
export function cells(frame: number, grilling: boolean): string {
  const g = grid(frame, grilling)
  const words = new Uint32Array(W * (H / 2) * 3)
  for (let r = 0; r < H / 2; r++) for (let x = 0; x < W; x++) {
    const top = g[r * 2][x], bottom = g[r * 2 + 1][x]
    const cell = top ? [0x2580, rgb(top), bottom ? rgb(bottom) : DEFAULT] : bottom ? [0x2584, rgb(bottom), DEFAULT] : [0x20, DEFAULT, DEFAULT]
    words.set(cell, (r * W + x) * 3)
  }
  return new Uint8Array(words.buffer).toBase64()
}
