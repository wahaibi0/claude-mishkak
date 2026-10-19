<p align="center"><img src="preview.svg" alt="Clawd grilling mishkak by a campfire in the Omani dunes" width="100%"></p>

# Mishkak 🍢

A Claude Code mod. While Claude works, Clawd grills **mishkak** by a campfire in the Omani dunes, above the prompt, and the answer keeps streaming as usual. The meat cooks from raw to charred, then Clawd eats it. When Claude is idle, Clawd just sits by the fire.

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
