# Additions ledger

Every setting, skill or schema field added while a feature is being worked on,
and whether the finished feature still uses it. Before a feature ships, remove
everything marked **unused** (and its strings, share slot, Quick Bar wiring and
docs), then drop its rows here.

| Added | For | Where | Used |
|:--|:--|:--|:--|
| `SkillType.NightmareSet`, `UiText.SkillNightmareSet`, `src/skills/nbcSet.ts` | NBC Set skill | `src/shared.d.ts`, `src/strings.d.ts`, `src/uiEn.ts`, `src/skillOptions.ts` | used |
| `SkillHandler.scalesBoard`, `skillScalesBoard`, `Config.boardScale`, `BoardScaleRead`, `readBoardScale`, `updateBoardScale`, `Tsum.boardScaleReads`, `Log.Board.Scale`, `BoardScaleRead.minRadiusCircles` / `radiusPerWidth`, `Tsum.boardScaleTrend` | NBC Set: board read follows shrinking tsums | `src/skills/skillCore.ts`, `src/data.ts`, `src/pathfinding.ts`, `src/board.ts`, `src/play.ts`, `src/logEvents.ts` | used |
| `SkillHandler.colorBlur`, `skillColorBlur`, `TsumColorBlur` | NBC Set: Sally kept out of the Jack/Zero cluster | `src/skills/skillCore.ts`, `src/pathfinding.ts` | used |
| `NbcDice`, `NbcFaceRed`, `NbcPip`, `NbcGreen`, `nbcOogieSeen`, `nbcLook`, `NbcLook`, `nbcWatch`, `nbcCountPips`, `nbcPlayDice` (+ helpers), `nbcSaveRoll` (temporary diagnostics: remove once device reads are confirmed), `SkillHandler.watchScan`, `skillWatchScan`, `Log.Skill.NbcOogie`, `Log.Skill.NbcDice`, `Log.Skill.NbcDiceUnread` | NBC Set: Oogie Boogie dice read and reroll | `src/skills/nbcSet.ts`, `src/skills/skillCore.ts`, `src/board.ts`, `src/logEvents.ts`, `src/logsEn.ts`, `src/logsZhTw.ts` | used |
