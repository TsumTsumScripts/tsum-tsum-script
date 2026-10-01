# Additions ledger

Every setting, skill or schema field added while a feature is being worked on,
and whether the finished feature still uses it. Before a feature ships, remove
everything marked **unused** (and its strings, share slot, Quick Bar wiring and
docs), then drop its rows here.

| Added | For | Where | Used |
|:--|:--|:--|:--|
| `SkillType.NightmareSet`, `UiText.SkillNightmareSet`, `src/skills/nbcSet.ts` | NBC Set skill | `src/shared.d.ts`, `src/strings.d.ts`, `src/uiEn.ts`, `src/skillOptions.ts` | used |
| `SkillHandler.scalesBoard`, `skillScalesBoard`, `Config.boardScale`, `BoardScaleRead`, `readBoardScale`, `updateBoardScale`, `Tsum.boardScaleReads`, `Log.Board.Scale` | NBC Set: board read follows shrinking tsums | `src/skills/skillCore.ts`, `src/data.ts`, `src/pathfinding.ts`, `src/board.ts`, `src/play.ts`, `src/logEvents.ts` | used |
