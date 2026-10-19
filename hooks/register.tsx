import type { Register } from 'claude-code'
import { cells, FRAME_MS, FRAMES, H, MIN_W, svg, W } from './art'

const SVG = svg(true)
const frameNow = () => Math.floor(Date.now() / FRAME_MS) % FRAMES

// The scene takes the place of the spinner line, in the transcript under the streaming answer, and keeps the
// line beneath it. The spinner only exists while Claude works, so Clawd is always grilling here.
export const register: Register = on => {
  // Set while the scene is drawn in a terminal; the ticker redraws its cells until the turn ends.
  let ticking = false

  on('session.start', ($, e, next) => {
    $.clock.every(FRAME_MS, () => { if (ticking) $.ui.invalidate('ui.render') })
    return next(e)
  })

  on('turn.complete', ($, e, next) => {
    ticking = false
    return next(e)
  })

  on('ui.render', { component: 'Spinner' }, async ($, e, next) => {
    const columns = Math.min(W, (e.viewport?.columns ?? W) - 2)
    if (columns < MIN_W) return next(e)
    const line = await next(e)
    const { Box } = $.ui.resolve(e)

    // The terminal gets a fresh Raster each tick; the others animate the SVG themselves (SMIL needs isInteractive).
    if (e.surface === 'terminal') {
      ticking = true
      const { Raster } = $.ui.resolve(e)
      return (
        <Box flexDirection="column">
          <Raster key="mishkak" columns={columns} rows={H / 2} cells={cells(frameNow(), true, columns)} />
          {line}
        </Box>
      )
    }
    const { Svg } = $.ui.resolve(e) as any // every surface but the terminal has Svg
    return (
      <Box flexDirection="column">
        <Svg key="mishkak" source={SVG} alt="Clawd grilling mishkak while Claude works" isInteractive />
        {line}
      </Box>
    )
  })
}
