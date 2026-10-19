# Mishkak 🍢

A Claude Code mod: Clawd sits on a log by a campfire in the Omani dunes, under the palms, above the prompt. While Claude works, Clawd grills a skewer of **mishkak**, and the answer and steps keep streaming as usual.

The 4 pieces of meat go from raw, to browned, to charred, and then Clawd eats them and starts again. When Claude finishes, the skewer goes away.

![Idle by the fire, then grilling while Claude works](preview.png)

## Install

In Claude Code:

```text
/plugin install mishkak --marketplace wahaibi0/claude-mishkak
```

Answer `y` to add the marketplace, pick a scope, then run `/reload-plugins`.

It works in the terminal and in the Claude desktop app. In the terminal it takes 16 rows and is 96 columns wide. In a narrower window it crops the palms off the right, and below 60 columns it hides.

## Develop

```sh
claude --plugin-dir .      # run Claude Code with this folder's mod
claude plugin validate .
claude plugin test .
```

The art is drawn in code in `hooks/art.ts` (a 96×32 pixel grid, 48 frames of 250 ms). The desktop gets it as one animated SVG, and the terminal as half-block cells.
