import type { Register } from 'claude-code'
import { cells, FRAME_MS, FRAMES, H, MIN_W, svg, W } from './art'

const SVG = { grilling: svg(true), idle: svg(false) }
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
    const show = !hasSurvey && bodyColumns >= MIN_W
    // shortcut: idle, the terminal shows a still frame (no 4/s redraws while nothing happens).
    ticking = show && isWorking && e.surface === 'terminal'
    if (!show) return next(e)

    // The terminal gets a fresh Raster each tick; the others animate the SVG themselves (SMIL needs isInteractive).
    if (e.surface === 'terminal') {
      const { Raster } = $.ui.resolve(e)
      const columns = Math.min(W, bodyColumns)
      return <Raster key="mishkak" columns={columns} rows={H / 2} cells={cells(isWorking ? frameNow() : 0, isWorking, columns)} />
    }
    const { Svg } = $.ui.resolve(e) as any // every surface but the terminal has Svg
    return isWorking
      ? <Svg key="grilling" source={SVG.grilling} alt="Clawd grilling mishkak while Claude works" isInteractive />
      : <Svg key="idle" source={SVG.idle} alt="Clawd sitting by the fire in the dunes" isInteractive />
  })
}
