import type { Register } from 'claude-code'
import { cells, FRAME_MS, FRAMES, H, type Meat, meatFor, MIN_W, svg, W } from './art'

// One SVG per stage, made once: the desktop swaps them as the turn goes on.
const SVGS = { raw: svg(true, undefined, 'raw'), cooking: svg(true, undefined, 'cooking'), done: svg(true, undefined, 'done') } as Record<Meat, string>
const frameNow = () => Math.floor(Date.now() / FRAME_MS) % FRAMES

// The scene takes the place of the spinner line, in the transcript under the streaming answer, and keeps the
// line beneath it. The spinner only exists while Claude works, so Clawd is always grilling here. When the turn
// ends, the latest "Baked for 3s" line shows him idle by the fire.
export const register: Register = on => {
  let isOn = true
  // Set while the scene is drawn in a terminal; the ticker redraws its cells until the turn ends.
  let ticking = false
  // The stage the desktop's SVG shows, so the ticker redraws it only when the meat moves on.
  let drawnMeat: Meat | undefined
  let startedAt = Date.now()
  const meatNow = () => meatFor(Date.now() - startedAt)
  // The newest TurnDuration row is the first one drawn after the main turn completes; rows seen before can't claim it.
  let latest: string | undefined
  let awaiting = false
  const seen = new Set<string>()

  on('session.start', async ($, e, next) => {
    isOn = (await $.store.get('on')) !== false
    await $.command.register({ name: 'mishkak', description: 'Turn Clawd\'s campfire on or off', argumentHint: 'on|off', immediate: true })
    $.clock.every(FRAME_MS, () => { if (ticking || (drawnMeat && drawnMeat !== meatNow())) $.ui.invalidate('ui.render') })
    return next(e)
  })

  on('command.run', { command: 'mishkak' }, async ($, e) => {
    const arg = e.args.trim()
    isOn = arg === 'on' ? true : arg === 'off' ? false : !isOn
    if (!isOn) ticking = false, drawnMeat = undefined
    await $.store.set('on', isOn)
    $.ui.invalidate('ui.render')
    return { text: isOn ? 'Mishkak is on. Clawd is back by the fire.' : 'Mishkak is off. /mishkak on brings Clawd back.' }
  })

  on('turn.start', ($, e, next) => {
    if (e.agentId !== undefined) return next(e)
    startedAt = Date.now()
    // The last turn's idle scene steps aside for the grilling one.
    latest = undefined
    awaiting = false
    $.ui.invalidate('ui.render')
    return next(e)
  })

  on('turn.complete', ($, e, next) => {
    if (e.agentId !== undefined) return next(e)
    ticking = false
    drawnMeat = undefined
    awaiting = true
    return next(e)
  })

  on('ui.render', { component: 'Spinner' }, async ($, e, next) => {
    const columns = Math.min(W, (e.viewport?.columns ?? W) - 2)
    if (!isOn || columns < MIN_W) return next(e)
    const line = await next(e)
    const { Box } = $.ui.resolve(e)

    // The terminal gets a fresh Raster each tick; the others animate the SVG themselves (SMIL needs isInteractive).
    if (e.surface === 'terminal') {
      ticking = true
      const { Raster } = $.ui.resolve(e)
      return (
        <Box flexDirection="column">
          <Raster key="mishkak" columns={columns} rows={H / 2} cells={cells(frameNow(), true, columns, meatNow())} />
          {line}
        </Box>
      )
    }
    drawnMeat = meatNow()
    const { Svg } = $.ui.resolve(e) as any // every surface but the terminal has Svg
    return (
      <Box flexDirection="column">
        <Svg key="mishkak" source={SVGS[drawnMeat]} alt="Clawd grilling mishkak while Claude works" isInteractive />
        {line}
      </Box>
    )
  })

  // Terminal only: a still frame of Clawd by the fire, above the latest turn's closing line.
  on('ui.render', { component: 'TurnDuration' }, async ($, e, next) => {
    if (awaiting && !seen.has(e.requestId)) latest = e.requestId, awaiting = false
    seen.add(e.requestId)
    const columns = Math.min(W, (e.viewport?.columns ?? W) - 2)
    if (!isOn || e.surface !== 'terminal' || e.requestId !== latest || columns < MIN_W) return next(e)
    const line = await next(e)
    const { Box, Raster } = $.ui.resolve(e)
    return (
      <Box flexDirection="column">
        <Raster key="mishkak" columns={columns} rows={H / 2} cells={cells(0, false, columns)} />
        {line}
      </Box>
    )
  })
}
