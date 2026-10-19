import type { Register } from 'claude-code'
import { cells, FRAME_MS, FRAMES, H, svg, W } from './art'

const SVG = svg()
const frameNow = () => Math.floor(Date.now() / FRAME_MS) % FRAMES

export const register: Register = on => {
  // Set by the band each time it draws; the ticker only redraws the terminal's cells while Claude works.
  let ticking = false

  on('session.start', ($, e, next) => {
    $.clock.every(FRAME_MS, () => { if (ticking) $.ui.invalidate('ui.render') })
    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, ($, e, next) => {
    const { isWorking, hasSurvey, bodyColumns } = e.props
    const show = isWorking && !hasSurvey && bodyColumns >= W
    ticking = show && e.surface === 'terminal'
    if (!show) return next(e)

    // The terminal gets a fresh Raster each tick; the others animate the SVG themselves (SMIL needs isInteractive).
    if (e.surface === 'terminal') {
      const { Raster } = $.ui.resolve(e)
      return <Raster key="mishkak" columns={W} rows={H / 2} cells={cells(frameNow())} />
    }
    const { Svg } = $.ui.resolve(e) as any // every surface but the terminal has Svg
    return <Svg source={SVG} alt="Clawd grilling mishkak while Claude works" isInteractive />
  })
}
