import { expect, test } from 'claude-code/testing'
import { cells, FRAMES, grid, H, svg, W } from './art'

const band = (isWorking: boolean) =>
  ({ component: 'AbovePrompt', props: { isWorking, hasSurvey: false, maxRows: 20, bodyColumns: 80, scroll: { bodyRows: 19 }, view: {} } }) as any

test('Clawd grills only while Claude works', async ($, on) => {
  on('ui.render', ($$, e) => { const { Box } = $$.ui.resolve(e); return h(Box, {}) as any }) // the engine's own band: empty
  for (const [surface, type] of [['terminal', 'Raster'], ['desktop', 'Svg']] as const) {
    const working = await $.ui.mount({ plugin: 'mishkak', surface, ...band(true) })
    expect(await working.find({ type })).toBeDefined()
    await working.unmount()
    const idle = await $.ui.mount({ plugin: 'mishkak', surface, ...band(false) })
    expect(await idle.find({ type })).toBeUndefined()
    await idle.unmount()
  }
})

test('the art cooks the meat, then Clawd eats it', () => {
  const meat = (f: number) => grid(f)[6][21] // the middle row of the first piece
  expect(new Set([meat(0), meat(20), meat(40)]).size).toBe(3)
  expect(meat(46)).toBe('#b88a5c') // only the bare skewer left
  expect(svg().length).toBeLessThan(131072) // the Svg element's limit
  for (let f = 0; f < FRAMES; f++) expect(atob(cells(f)).length).toBe(W * (H / 2) * 12)
})
