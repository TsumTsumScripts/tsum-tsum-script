---
title: Commands
description: Every npm script in the package, and the ones that are not here.
---

# Commands

Run from `app.gap.Tsum/`.

| Command | Does |
|:--|:--|
| `npm run typecheck` | All four compilations: the game bundle, the settings page, the Quick Bar page, and `src/gapWorkflow.ts` alone. `typecheck:game`, `typecheck:settings`, `typecheck:quickbar`, `typecheck:workflow` for one. |
| `npm run build` | Compile both halves, regenerate `PAGE_DISPATCH.md` and `EVENTS.md`, run the traces and checks, inline the pages into `dist/`, write the channel's archive and its `.sha256`. `-- --channel Beta` picks the channel; `npm run build:ps` is the PowerShell wrapper. |
| `npm run buildAndAdb` | Build, then push every `dist/` file to the DEV folder (`scripts/DEV`) on each connected emulator; `buildAndAdb:beta` builds the Beta channel. |
| `npm run adb` | Push an existing `dist/` over the installed script's folder (`scripts/Official GAP/Tsum Tsum/`). `buildAndAdb` is the one that targets `scripts/DEV`. |
| `npm run pages:docs` | Regenerate `PAGE_DISPATCH.md`. `pages:docs:check` fails if it is stale. |
| `npm run events:docs` | Regenerate `EVENTS.md` from the `emitEvent` call sites. `events:docs:check` fails if it is stale, and reports an emit outside `Emit` or one event with two payload shapes. |
| `npm run dispatch:eval` | The dispatch queue and the scheduler against their golden traces; exit 1 on a changed row or a broken invariant. `-- -v`, `-- --only X`, `-- --dispatch` / `--scheduler`, `-- --strict`. |
| `npm run dispatch:update` | Rewrite the goldens from the bundle as it stands. The diff is the review. |
| `npm run map:check` | Verify `CODEMAP.md` against the tree. |
| `npm run i18n:check` | What each language is missing; a `data-i18n` naming no key. |
| `npm run workflow:check` | Drives the GAP Companion workflow runner and Tsum's run mode in the built bundle. |
| `npm run live:check` | Every setting a preset carries says when it reaches a running script, and the value survives the round trip. |
| `npm run release:alpha` | Build the Alpha channel and publish it to the catalogue; `release:beta`, `release:production` likewise. `-- --dry-run` shows the entry without writing; `-- --yes` skips the note review. |

`npm run build` runs `pages:docs`, `events:docs`, `dispatch:eval` and
`map:check` as *optional* steps that print findings and never block, and
`live:check` as a required one.

## Not in this package

Source comments occasionally cite a command this `package.json` does not
define. Those belong to a separate, private maintainers' repository that runs
against this one's build; treat the result they produce (a threshold, a timing)
as the measurement behind the number in the source, and leave the number alone
unless you can measure it again.

## The site's own commands

The documentation site under `website/` has its own scripts — `start`,
`build`, `sync`, `refs:check` — described in `website/README.md`.
