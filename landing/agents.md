# agent-lifeline

Standalone CLI for coding-agent handoff snapshots.

## What it does

`agent-lifeline` captures critical project context before agent session reset / compact / switch:

- git branch + dirty state + changed files
- open tasks from common planning files
- optional execution log tail
- recent prompt hints from local Claude history files (if available)

Snapshot output is local to the project:

- `.agent-lifeline/latest.json`
- `.agent-lifeline/snapshots/<timestamp>.json`

## Why it matters

- Resume work quickly after context loss.
- Share portable handoff between Claude, Codex, Cursor, or human reviewers.
- No runtime dependencies, no database, no hosted backend.

## Core commands

```bash
agent-lifeline save --focus "continue checkout retry bug"
agent-lifeline show
agent-lifeline export > HANDOFF.md
agent-lifeline doctor
```

One-off usage:

```bash
npx -y agent-lifeline@latest save --focus "continue checkout retry bug"
```

## Project links

- Repo: https://github.com/yunusemrgrl/agent-lifeline
- README: https://github.com/yunusemrgrl/agent-lifeline#readme
- npm: https://www.npmjs.com/package/agent-lifeline
- Landing: https://yunusemrgrl.github.io/agent-lifeline/

## Media links

- Terminal preview: `./assets/agent-lifeline-terminal.png`
- Flow poster: `./assets/agent-lifeline-flow-poster.png`
- Flow video: `./assets/agent-lifeline-flow.mp4`
