import { expect, mock, test } from 'claude-code/testing'
import { cells, fade, FRAMES, grid, H, type Meat, meatFor, MIN_W, svg, W } from './art'

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

// The engine beneath the plugin: its spinner and closing lines, and the events the session raises.
const engine = (on: any) => {
  mock.store(on)
  mock.clock(on)
  on('session.start', ($$: any, e: any) => ({ cwd: e.cwd }))
  on('command.register', (_: any, e: any) => ({ value: { command: e.name } }))
  on('turn.start', (_: any, e: any) => ({ turnId: e.turnId }))
  on('turn.complete', () => ({ text: '' }))
  on('ui.render', ($$: any, e: any) => { const { Text } = $$.ui.resolve(e); return h(Text, { key: 'line' }, e.component === 'Spinner' ? 'Grilling…' : 'Baked for 3s') as any })
}
const baked = (requestId: string) =>
  ({ plugin: 'mishkak', surface: 'terminal', component: 'TurnDuration', requestId, props: { word: 'Baked', durationMs: 3000 }, viewport: { columns: 120, rows: 40 } }) as any

test('/mishkak off leaves the spinner its own line, and on brings Clawd back', async ($, on) => {
  engine(on)
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  for (const [args, isShown] of [['off', false], ['on', true], ['', false], ['', true]] as const) {
    const { text } = await $.command.run({ command: 'mishkak', args } as any)
    expect(text).toMatch(isShown ? / on\./ : / off\./)
    const ui = await $.ui.mount({ plugin: 'mishkak', surface: 'terminal', ...spinner(120) })
    expect(Boolean(await ui.find({ type: 'Raster' }))).toBe(isShown)
    expect(await ui.find({ type: 'Text', text: /Grilling/ })).toBeDefined()
    await ui.unmount()
  }
})

test('the latest turn\'s closing line shows Clawd idle by the fire; older ones and a new turn drop it', async ($, on) => {
  engine(on)
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  await $.turn.start({ text: 'hi', turnId: 't1' })
  await $.turn.complete({ answer: '', durationMs: 3000, isAborted: false, turnId: 't1', reason: 'answer' })
  const first = await $.ui.mount(baked('m1'))
  expect(await first.find({ type: 'Raster' })).toBeDefined()
  expect(await first.find({ type: 'Text', text: /Baked/ })).toBeDefined()
  await first.unmount()
  await $.turn.start({ text: 'more', turnId: 't2' })
  const old = await $.ui.mount(baked('m1')) // the first line, drawn again once a new turn started
  expect(await old.find({ type: 'Raster' })).toBeUndefined()
  await old.unmount()
  await $.turn.complete({ answer: '', durationMs: 3000, isAborted: false, turnId: 't2', reason: 'answer' })
  const again = await $.ui.mount(baked('m1')) // a row seen before can't claim the new turn's scene
  expect(await again.find({ type: 'Raster' })).toBeUndefined()
  await again.unmount()
  const second = await $.ui.mount(baked('m2'))
  expect(await second.find({ type: 'Raster' })).toBeDefined()
  await second.unmount()
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

test('the stars twinkle, each in its own time', () => {
  const star = (f: number) => grid(f, false)[1][3]
  expect(new Set(Array.from({ length: FRAMES }, (_, f) => star(f)))).toEqual(new Set(['#cfd6ff', '#8890c0']))
  expect(star(0)).not.toBe(grid(0, false)[1][22]) // not in step
})

test('the meat can be held at a stage, chosen by how long the turn has run', () => {
  expect([0, 14999, 15000, 44999, 45000, 600000].map(meatFor)).toEqual(['raw', 'raw', 'cooking', 'cooking', 'done', 'done'])
  for (let f = 0; f < FRAMES; f++) expect(grid(f, true, true, 'done')[12][40]).toBe('#6e3a20')
  for (let f = 0; f < FRAMES; f++) expect(grid(f, true, true, 'eaten')[12][40]).toBe('#d9b380')
  for (const meat of ['raw', 'cooking', 'done', 'eaten', undefined] as (Meat | undefined)[])
    for (const grilling of [true, false]) expect(svg(grilling, undefined, meat).length).toBeLessThan(131072)
})
