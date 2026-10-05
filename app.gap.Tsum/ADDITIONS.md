# Additions ledger

Every setting, skill or schema field added while a feature is being worked on,
and whether the finished feature still uses it. Before a feature ships, remove
everything marked **unused** (and its strings, share slot, Quick Bar wiring and
docs), then drop its rows here.

| Added | For | Where | Used |
|:--|:--|:--|:--|
| `BubbleStrategy.SaveOneMidChain`, `UiText.BubbleSaveOneMidChain` / `BubbleSaveOneMidChainShort` / `FlowLinkAllButOne`, share slot `S`, `richestFirst` | Save One Mid Chain bubble strategy | `src/shared.d.ts`, `src/bubbleOptions.ts`, `src/strings.d.ts`, `src/ui*.ts`, `src/quickbar.ts`, `src/settings.ts`, `src/board.ts` | used |
| `BubbleStrategy.SaveOne`, `UiText.BubbleSaveOne` / `BubbleSaveOneShort` / `FlowPopAllButOne`, share slot `s` | Save One bubble strategy | `src/shared.d.ts`, `src/bubbleOptions.ts`, `src/strings.d.ts`, `src/ui*.ts`, `src/quickbar.ts`, `src/settings.ts`, `src/board.ts` | used |
| `GameBubbleConfig.bandFrom` / `bandParam2` / `bandMaxRadius` / `darkMax` / `whiteMax`, `bubbleLooks`, `bubbleNear`, `shortHoldAfterSkillMs`, `overflowAt` / `overflowKeep`, `pileUpSweepAt`, `popBubbleOverflow`, `bubbleBandTopY`, `Log.Bubble.Overflow` | Faster bubble popping | `src/data.ts`, `src/pathfinding.ts`, `src/board.ts`, `src/play.ts`, `src/logEvents.ts` | used |
| `SettingKey.TsumListOnly` (start flag, no row) | Tsum List export: a run started for it stops after | `src/shared.d.ts`, `src/runPlan.ts`, `src/index.ts` | used |
| `RowKey.ExportTsumList` + `GroupTsumList`/`SettingExportTsumList` strings | Tsum List Now button | `src/settings.d.ts`, `src/settings.ts`, `src/strings.d.ts`, `src/uiEn.ts` | used |
| `CollectionSortDialog.ownedOnly*`, `sortCollection`'s `ownedOnly` | Tsum List: owned tsums only | `src/data.ts`, `src/levelCap.ts` | used |
| `CollectionGrid.scrubFirst` / `scrubLast`, `skipCollectionToEnd`, `tsumListTurnPage`'s `back`, `Log.Workflow.SelectTsumEndChanged` | Collection scrubber: first/last page in one tap | `src/data.ts`, `src/levelCap.ts`, `src/tsumList.ts`, `src/myTsumSelect.ts`, `src/logEvents.ts` | used |
| `CollectionGrid.nextPageSamples`, `body*`, `selected*` | Tsum List: last page, empty/selected slots | `src/data.ts` | used |
| `StatsRegion.slash`, `StatsRegion.scale`, `StatsSlash` | Tsum List: "5/10" and the 9px dates | `src/globals.d.ts`, `src/roundStats.ts` | used |
| `TsumListPortrait`, `TsumListRegions`, `src/tsumsCollection.dat` | Tsum List: naming by portrait, level/skill/date reads | `src/data.ts`, build, lexicon | used |
| `TsumListRegions.skillBar`/`skillFill`, `readSkillProgress` | Tsum List: `skill_progress` column | `src/data.ts`, `src/tsumList.ts` | used |
| `TsumListName`, `src/tsumNames.dat`, `myTsumUnpack` | Tsum List: printed-name fallback for art twins | `src/data.ts`, `src/tsumList.ts`, `src/roundStats.ts`, build, lexicon | used |
| `SettingKey.StopAfterGames`, `SettingKey.StopAfterAction`, `StopAfterAction`, `src/stopAfterOptions.ts` | Stop after games | `src/shared.d.ts`, `src/settings.ts`, `src/quickbar.ts`, `src/quickbar.html`, `src/play.ts` | used |
| `emitTrace()` / `traceAttached()` host natives, `src/trace.ts` (`Trace.Kind`, `traceOn`, `traceSend`), `Log.Log.TraceFailed`, `traceWantFrame()` / `traceFrameId()` host natives, `traceFrameAsk`, `traceFrameOf`, `traceMarks`, `Tsum.squareFrame` | Trace stream: live debug data, frames and marks for dev tools | `src/globals.d.ts`, `src/trace.ts`, `src/logging.ts`, `src/board.ts`, `src/forecast.ts`, `src/logEvents.ts`, host `api_system.cpp` / `TraceStream.kt` | used |
| `pauseScript()` host native | Stop after games: Pause | `src/globals.d.ts`, host `api_system.cpp` | used |
| `SkillType.NightmareSet`, `UiText.SkillNightmareSet`, `src/skills/nbcSet.ts` | NBC Set skill | `src/shared.d.ts`, `src/strings.d.ts`, `src/uiEn.ts`, `src/skillOptions.ts` | used |
| `SkillHandler.scalesBoard`, `skillScalesBoard`, `Config.boardScale`, `BoardScaleRead`, `readBoardScale`, `updateBoardScale`, `Tsum.boardScaleReads`, `Log.Board.Scale`, `BoardScaleRead.minRadiusCircles` / `radiusPerWidth`, `Tsum.boardScaleTrend` | NBC Set: board read follows shrinking tsums | `src/skills/skillCore.ts`, `src/data.ts`, `src/pathfinding.ts`, `src/board.ts`, `src/play.ts`, `src/logEvents.ts` | used |
| `SkillHandler.colorBlur`, `skillColorBlur`, `TsumColorBlur` | NBC Set: Sally kept out of the Jack/Zero cluster | `src/skills/skillCore.ts`, `src/pathfinding.ts` | used |
| `NbcDice`, `NbcFaceRed`, `NbcPip`, `NbcGreen`, `nbcOogieSeen`, `nbcLook`, `NbcLook`, `nbcWatch`, `nbcCountPips`, `nbcPlayDice` (+ helpers), `nbcSaveRoll` (temporary diagnostics: remove once device reads are confirmed), `SkillHandler.watchScan`, `skillWatchScan`, `Log.Skill.NbcOogie`, `Log.Skill.NbcDice`, `Log.Skill.NbcDiceUnread` | NBC Set: Oogie Boogie dice read and reroll | `src/skills/nbcSet.ts`, `src/skills/skillCore.ts`, `src/board.ts`, `src/logEvents.ts`, `src/logsEn.ts`, `src/logsZhTw.ts` | used |
| `SkillType.VillainsSet`, `UiText.SkillVillainsSet`, `src/skills/villainsSet.ts` | Villains Set skill | `src/shared.d.ts`, `src/strings.d.ts`, `src/uiEn.ts`, `src/skillOptions.ts` | used |
| `SkillHandler.chromaCap`, `skillChromaCap` | Villains Set: neon board colour read | `src/skills/skillCore.ts`, `src/pathfinding.ts` | used |
