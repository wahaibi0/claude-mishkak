import { expect, test } from 'claude-code/testing'
import { cells, fade, FRAMES, grid, H, MIN_W, svg, W } from './art'

const spinner = (columns: number) =>
  ({ component: 'Spinner', props: { word: 'Grilling', message: null, suffix: '…', mode: 'responding' }, viewport: { columns, rows: 40 } }) as any

test('the scene takes the spinner\'s place in the transcript, keeping its line, and steps aside when narrow', async ($, on) => {
  on('ui.render', ($$, e) => { const { Text } = $$.ui.resolve(e); return h(Text, { key: 'line' }, 'Grilling…') as any }) // the engine's spinner line
  for (const [surface, type] of [['terminal', 'Raster'], ['desktop', 'Svg']] as const) {
    const ui = await $.ui.mount({ plugin: 'mishkak', surface, ...spinner(120) })
    expect(await ui.find({ type })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /Grilling/ })).toBeDefined()
    await ui.unmount()
    const narrow = await $.ui.mount({ plugin: 'mishkak', surface, ...spinner(MIN_W) })
    expect(await narrow.find({ type })).toBeUndefined()
    await narrow.unmount()
  }
})

test('the skewer shows only while grilling; the meat cooks, then Clawd eats it', () => {
  const stick = (f: number, grilling: boolean) => grid(f, grilling)[16][35]
  const meat = (f: number) => grid(f, true)[12][40] // the middle of the first piece
  expect(stick(0, true)).toBe('#d9b380')
  expect(stick(0, false)).not.toBe('#d9b380')
  expect(new Set([meat(0), meat(20), meat(40)]).size).toBe(3)
  expect(meat(46)).toBe('#d9b380') // only the bare skewer left
  // Embers rise from the fire: the first leaves at (44, 18) and is 2 pixels higher a frame later.
  expect(grid(0, false)[18][44]).toBe('#ff9f43')
  expect(grid(1, false)[16][44]).toBe('#ff9f43')
  expect(svg(false)).toContain('animateTransform')
  // The faded border: gone at the corners, untouched in the middle, and it follows a cropped edge.
  expect(fade(0, 0)).toBe(0)
  expect(fade(W / 2, H / 2)).toBe(1)
  expect(fade(MIN_W - 1, H / 2, MIN_W)).toBeLessThan(1)
  expect(svg(true)).toContain('mask="url(#fade)"')
  for (const grilling of [true, false]) {
    expect(svg(grilling).length).toBeLessThan(131072) // the Svg element's limit
    for (let f = 0; f < FRAMES; f++) expect(atob(cells(f, grilling)).length).toBe(W * (H / 2) * 12)
    expect(atob(cells(0, grilling, MIN_W)).length).toBe(MIN_W * (H / 2) * 12) // cropped for a narrow terminal
  }
})
