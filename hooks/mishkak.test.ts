import { expect, test } from 'claude-code/testing'
import { cells, FRAMES, grid, H, svg, W } from './art'

const band = (isWorking: boolean, bodyColumns = 80) =>
  ({ component: 'AbovePrompt', props: { isWorking, hasSurvey: false, maxRows: 20, bodyColumns, scroll: { bodyRows: 19 }, view: {} } }) as any

test('the scene shows on every surface, and steps aside when it does not fit', async ($, on) => {
  on('ui.render', ($$, e) => { const { Box } = $$.ui.resolve(e); return h(Box, {}) as any }) // the engine's own band: empty
  for (const [surface, type] of [['terminal', 'Raster'], ['desktop', 'Svg']] as const) {
    for (const working of [true, false]) {
      const ui = await $.ui.mount({ plugin: 'mishkak', surface, ...band(working) })
      expect(await ui.find({ type })).toBeDefined()
      await ui.unmount()
    }
    const narrow = await $.ui.mount({ plugin: 'mishkak', surface, ...band(true, W - 1) })
    expect(await narrow.find({ type })).toBeUndefined()
    await narrow.unmount()
  }
})

test('the skewer shows only while grilling; the meat cooks, then Clawd eats it', () => {
  const stick = (f: number, grilling: boolean) => grid(f, grilling)[12][20]
  const meat = (f: number) => grid(f, true)[10][27] // the middle of the first piece
  expect(stick(0, true)).toBe('#d9b380')
  expect(stick(0, false)).not.toBe('#d9b380')
  expect(new Set([meat(0), meat(20), meat(40)]).size).toBe(3)
  expect(meat(46)).toBe('#d9b380') // only the bare skewer left
  for (const grilling of [true, false]) {
    expect(svg(grilling).length).toBeLessThan(131072) // the Svg element's limit
    for (let f = 0; f < FRAMES; f++) expect(atob(cells(f, grilling)).length).toBe(W * (H / 2) * 12)
  }
})
