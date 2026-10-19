// Clawd grilling mishkak: a 40x16 pixel scene, 48 frames of 250ms (a 12s loop).
// One grid per frame feeds both the desktop's SVG and the terminal's half-block cells.

export const W = 40
export const H = 16
export const FRAMES = 48
export const FRAME_MS = 250

type Grid = (string | null)[][]

const CLAWD = '#d97757'
const EYE = '#2a1d18'
const STICK = '#b88a5c'
const LOG = '#5a3a24'
const LOG_DARK = '#3a2416'
const FLAME = ['#fff4c2', '#ffd36b', '#ff9f43', '#ea5a32', '#b8372a'] // core to edge
const MEAT = {
  raw: ['#c4483f', '#e8857a', '#8e2f2a'], // body, highlight, shade
  cooking: ['#a65a34', '#cf8550', '#7a3c22'],
  done: ['#6e3a20', '#9a5a30', '#3a1c10'],
}
const CHUNKS = [20, 24, 28, 32] // left x of each 3x3 piece on the skewer
const FIRE_X = 19
// Flame height per column, one row per fire frame.
const FIRE = [
  [1, 2, 3, 3, 4, 5, 4, 5, 6, 5, 4, 5, 4, 3, 3, 2, 1],
  [1, 2, 2, 4, 5, 4, 5, 6, 5, 4, 5, 4, 3, 4, 2, 2, 1],
  [2, 2, 3, 4, 3, 4, 6, 5, 4, 5, 6, 4, 4, 3, 3, 1, 1],
]

const box = (g: Grid, x: number, y: number, w: number, h: number, c: string) => {
  for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) g[j][i] = c
}

export function grid(frame: number): Grid {
  const f = ((frame % FRAMES) + FRAMES) % FRAMES
  const g: Grid = Array.from({ length: H }, () => Array<string | null>(W).fill(null))
  const eaten = f >= 44

  // Clawd: body, the arm holding the skewer, four legs, eyes.
  box(g, 2, 4, 10, 7, CLAWD)
  box(g, 1, 7, 1, 2, CLAWD)
  box(g, 12, 6, 2, 2, CLAWD)
  for (const x of [3, 5, 8, 10]) box(g, x, 11, 1, 3, CLAWD)
  if (eaten) {
    // ^ ^ happy eyes once the mishkak is gone
    for (const x of [4, 8]) { g[6][x] = EYE; g[5][x + 1] = EYE; g[6][x + 2] = EYE }
  } else if (f === 10 || f === 30) {
    box(g, 4, 6, 2, 1, EYE); box(g, 8, 6, 2, 1, EYE) // blink
  } else {
    box(g, 4, 5, 1, 2, EYE); box(g, 9, 5, 1, 2, EYE)
  }

  // The skewer, then the four pieces of meat cooking on it.
  box(g, 14, 6, 23, 1, STICK)
  if (!eaten) {
    const [body, light, shade] = f < 16 ? MEAT.raw : f < 32 ? MEAT.cooking : MEAT.done
    for (const x of CHUNKS) { box(g, x, 5, 3, 3, body); g[5][x] = light; g[7][x + 2] = shade }
  }

  // Fire: each column burns from the logs up, red at the tips, paler deeper in, darker at the sides.
  FIRE[f % 3].forEach((h, i) => {
    const side = Math.min(i, 16 - i) < 3 ? 1 : 0
    for (let k = 0; k < h; k++) g[13 - k][FIRE_X + i] = FLAME[Math.max(0, 3 - (h - 1 - k)) + side]
  })
  box(g, 18, 14, 19, 1, LOG)
  box(g, 20, 15, 15, 1, LOG_DARK)
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
export function svg(scale = 6): string {
  const grids = Array.from({ length: FRAMES }, (_, f) => grid(f))
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
export function cells(frame: number): string {
  const g = grid(frame)
  const words = new Uint32Array(W * (H / 2) * 3)
  for (let r = 0; r < H / 2; r++) for (let x = 0; x < W; x++) {
    const top = g[r * 2][x], bottom = g[r * 2 + 1][x]
    const cell = top ? [0x2580, rgb(top), bottom ? rgb(bottom) : DEFAULT] : bottom ? [0x2584, rgb(bottom), DEFAULT] : [0x20, DEFAULT, DEFAULT]
    words.set(cell, (r * W + x) * 3)
  }
  return new Uint8Array(words.buffer).toBase64()
}
