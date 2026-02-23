# agent-lifeline

Standalone CLI for **handoff snapshots** across coding agents.

[![npm version](https://img.shields.io/npm/v/agent-lifeline?color=22d3ee&labelColor=0b1224)](https://www.npmjs.com/package/agent-lifeline)
[![CI](https://github.com/yunusemrgrl/agent-lifeline/actions/workflows/ci.yml/badge.svg)](https://github.com/yunusemrgrl/agent-lifeline/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-84cc16.svg?labelColor=0b1224)](https://opensource.org/licenses/MIT)

![agent-lifeline terminal capture](docs/media/agent-lifeline-terminal.png)

When a session gets compacted, cleared, or switched, context drops.
`agent-lifeline` captures minimum useful state in one local snapshot:

- git branch, dirty status, changed files
- open tasks from common planning files
- optional execution log tail (`execution.log`, `logs/execution.log`, etc.)
- recent prompts from `~/.claude/history.jsonl`
- latest matching Claude transcript hints

Snapshots are written to:

```text
.agent-lifeline/latest.json
.agent-lifeline/snapshots/<timestamp>.json
```

Project-local by default. No database.

![agent-lifeline handoff flow](docs/media/agent-lifeline-flow.gif)

## Quick start

```bash
# one-off
npx -y agent-lifeline@latest save --focus "continue auth migration"

# or install globally
npm i -g agent-lifeline
agent-lifeline save --focus "continue auth migration"
```

## Commands

```bash
# Save a handoff snapshot
agent-lifeline save --focus "continue checkout bug"

# Show latest snapshot summary
agent-lifeline show --cwd /path/to/project

# Export markdown handoff for next agent session
agent-lifeline export --cwd /path/to/project

# Health check
agent-lifeline doctor

# JSON output
agent-lifeline show --json
```

## Why this is useful

- Fast resume after `/clear` or compaction.
- Works across Claude, Codex, Cursor, and human handoff.
- Zero runtime dependencies.
- Portable markdown handoff output.

## Landing and media

- Landing page source: `landing/index.html`
- Agent-readable page: `landing/agents.md`
- LLM discovery file: `landing/llms.txt`
- GitHub Pages deploy workflow: `.github/workflows/landing-pages.yml`
- Landing and README visuals in this repo are static files under:
  - `landing/assets/`
  - `docs/media/`
- Remotion source was moved out of this repo to keep `agent-lifeline` CLI-only.
  - See: `../agent-lifeline-promo`

## AI crawler optimization

To reduce HTML parsing overhead for AI crawlers, this repo publishes a clean markdown view:

- `agents.md`: concise product + command summary
- `llms.txt`: machine-readable entrypoint that points crawlers to preferred content

If you use Cloudflare "Markdown for Agents", keep it enabled and still expose these static files as deterministic fallback URLs.

## Development

```bash
npm install
npm run lint
npm test
npm run pack:check
```

## Publish checklist

1. Bump `version` in `package.json`.
2. Push to `main`.
3. `release.yml` publishes to npm (if not already published), then tags and creates a GitHub Release.

## Notes

- Node.js `>=18`
- Best in git repos
- Reads `~/.claude` sources when available

## License

MIT
