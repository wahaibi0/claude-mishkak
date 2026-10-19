import type { Register } from 'claude-code'
import { cells, FRAME_MS, FRAMES, H, type Meat, meatFor, MIN_W, svg, W, withStats } from './art'

// One SVG per stage, made once: the desktop swaps them as the turn goes on.
const SVGS = { raw: svg(true, undefined, 'raw'), cooking: svg(true, undefined, 'cooking'), done: svg(true, undefined, 'done') } as Record<Meat, string>
const STAGES: Meat[] = ['raw', 'cooking', 'done']
const frameNow = () => Math.floor(Date.now() / FRAME_MS) % FRAMES
const elapsed = (ms: number) => {
  const s = Math.floor(ms / 1000)
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m${String(s % 60).padStart(2, '0')}s`
}

// The scene takes the place of the spinner line, in the transcript under the streaming answer, and keeps the
// line beneath it. The spinner only exists while Claude works, so Clawd is always grilling here. When the turn
// ends, the latest "Baked for 3s" line shows him idle by the fire.
export const register: Register = on => {
  let isOn = true
  let showStats = true
  // Set while the scene is drawn in a terminal; the ticker redraws its cells until the turn ends.
  let ticking = false
  // What the desktop's SVG shows and when it was drawn, so the ticker redraws it only when that is stale.
  let drawnMeat: Meat | undefined
  let drawnAt = 0
  let startedAt = Date.now()
  let costAtStart = 0
  let lastStats = '' // the finished turn's, for its idle scene
  // The meat only ever cooks forward: by time, and straight to done once Claude is writing the answer,
  // which is usually the end of the turn.
  let reached = 0
  const meatNow = () => STAGES[(reached = Math.max(reached, STAGES.indexOf(meatFor(Date.now() - startedAt))))]
  // The newest TurnDuration row is the first one drawn after the main turn completes; rows seen before can't claim it.
  let latest: string | undefined
  let awaiting = false
  const seen = new Set<string>()

  // This prompt's cost, how full the context is, and how long it has run: `$0.04 · 24% · 1m05s`.
  // A host that can't say (the call failed) shows no stats rather than no Clawd.
  const stats = (usage: { cost?: { usd: number }; context: { percent?: number } } | undefined) => {
    if (!showStats || !usage) return ''
    const { cost, context } = usage
    const percent = context.percent === undefined ? '–' : `${Math.round(context.percent)}%`
    return `$${Math.max(0, (cost?.usd ?? 0) - costAtStart).toFixed(2)} · ${percent} · ${elapsed(Date.now() - startedAt)}`
  }

  on('session.start', async ($, e, next) => {
    isOn = (await $.store.get('on')) !== false
    showStats = (await $.store.get('stats')) !== false
    await $.command.register({ name: 'mishkak', description: 'Turn Clawd\'s campfire, or its stats, on or off', argumentHint: 'on|off|stats [on|off]', immediate: true })
    $.clock.every(FRAME_MS, () => {
      const stale = drawnMeat && (drawnMeat !== meatNow() || (showStats && Date.now() - drawnAt >= 1000))
      if (ticking || stale) $.ui.invalidate('ui.render')
    })
    return next(e)
  })

  on('command.run', { command: 'mishkak' }, async ($, e) => {
    const [what, arg = ''] = e.args.trim().split(/\s+/)
    if (what === 'stats') {
      showStats = arg === 'on' ? true : arg === 'off' ? false : !showStats
      await $.store.set('stats', showStats)
      $.ui.invalidate('ui.render')
      return { text: showStats ? 'Mishkak stats are on: cost · context · time, top right.' : 'Mishkak stats are off.' }
    }
    isOn = what === 'on' ? true : what === 'off' ? false : !isOn
    if (!isOn) ticking = false, drawnMeat = undefined
    await $.store.set('on', isOn)
    $.ui.invalidate('ui.render')
    return { text: isOn ? 'Mishkak is on. Clawd is back by the fire.' : 'Mishkak is off. /mishkak on brings Clawd back.' }
  })

  on('turn.start', async ($, e, next) => {
    if (e.agentId !== undefined) return next(e)
    startedAt = Date.now()
    reached = 0
    costAtStart = (await $.session.usage().catch(() => undefined))?.cost?.usd ?? 0
    // The last turn's idle scene steps aside for the grilling one.
    latest = undefined
    awaiting = false
    $.ui.invalidate('ui.render')
    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    if (e.agentId !== undefined) return next(e)
    ticking = false
    drawnMeat = undefined
    lastStats = stats(await $.session.usage().catch(() => undefined))
    awaiting = true
    return next(e)
  })

  on('ui.render', { component: 'Spinner' }, async ($, e, next) => {
    const columns = Math.min(W, (e.viewport?.columns ?? W) - 2)
    if (!isOn || columns < MIN_W) return next(e)
    if (e.props.mode === 'responding') reached = STAGES.length - 1
    const line = await next(e)
    const text = stats(await $.session.usage().catch(() => undefined))
    const { Box } = $.ui.resolve(e)

    // The terminal gets a fresh Raster each tick; the others animate the SVG themselves (SMIL needs isInteractive).
    if (e.surface === 'terminal') {
      ticking = true
      const { Raster } = $.ui.resolve(e)
      return (
        <Box flexDirection="column">
          <Raster key="mishkak" columns={columns} rows={H / 2} cells={cells(frameNow(), true, columns, meatNow(), text)} />
          {line}
        </Box>
      )
    }
    drawnMeat = meatNow()
    drawnAt = Date.now()
    const { Svg } = $.ui.resolve(e) as any // every surface but the terminal has Svg
    return (
      <Box flexDirection="column">
        <Svg key="mishkak" source={withStats(SVGS[drawnMeat], text)} alt="Clawd grilling mishkak while Claude works" isInteractive />
        {line}
      </Box>
    )
  })

  // Terminal only: a still frame of Clawd by the fire, above the latest turn's closing line, with that turn's stats.
  on('ui.render', { component: 'TurnDuration' }, async ($, e, next) => {
    if (awaiting && !seen.has(e.requestId)) latest = e.requestId, awaiting = false
    seen.add(e.requestId)
    const columns = Math.min(W, (e.viewport?.columns ?? W) - 2)
    if (!isOn || e.surface !== 'terminal' || e.requestId !== latest || columns < MIN_W) return next(e)
    const line = await next(e)
    const { Box, Raster } = $.ui.resolve(e)
    return (
      <Box flexDirection="column">
        <Raster key="mishkak" columns={columns} rows={H / 2} cells={cells(0, false, columns, undefined, showStats ? lastStats : '')} />
        {line}
      </Box>
    )
  })
}
