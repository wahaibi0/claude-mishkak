<p align="center"><img src="preview.svg" alt="Clawd grilling mishkak by a campfire in the Omani dunes" width="100%"></p>

A Claude Code mod. While Claude works, Clawd grills **mishkak** by a campfire in the Omani dunes, right in the transcript under the streaming answer, where the spinner line is. The meat cooks the longer Claude works, and is done once Claude starts writing its answer. After each answer, Clawd rests by the fire on its closing line.

Top right: this prompt's cost · context used · time.

- `/mishkak on|off` turns Clawd on or off
- `/mishkak stats on|off` shows or hides the stats

No argument toggles; your choice is kept.

## Install

```text
/plugin install mishkak --marketplace wahaibi0/claude-mishkak
```

Answer `y`, pick a scope, then run `/reload-plugins`. Works in the terminal (60+ columns) and the desktop app.

## Develop

```sh
claude --plugin-dir .    # run with this mod
claude plugin test .
bun -e "import { svg } from './hooks/art.ts'; await Bun.write('preview.svg', svg(true, 7))"    # refresh the preview
```

The art is drawn in code in `hooks/art.ts`.
