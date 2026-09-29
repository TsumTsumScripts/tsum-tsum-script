# Additions ledger

Every setting, skill or schema field added while a feature is being worked on,
and whether the finished feature still uses it. Before a feature ships, remove
everything marked **unused** (and its strings, share slot, Quick Bar wiring and
docs), then drop its rows here.

| Added | For | Where | Used |
|:--|:--|:--|:--|
| `SettingKey.TsumListOnly` (start flag, no row) | Tsum List export: a run started for it stops after | `src/shared.d.ts`, `src/runPlan.ts`, `src/index.ts` | used |
| `RowKey.ExportTsumList` + `GroupTsumList`/`SettingExportTsumList` strings | Tsum List Now button | `src/settings.d.ts`, `src/settings.ts`, `src/strings.d.ts`, `src/uiEn.ts` | used |
| `CollectionSortDialog.ownedOnly*`, `sortCollection`'s `ownedOnly` | Tsum List: owned tsums only | `src/data.ts`, `src/levelCap.ts` | used |
| `CollectionGrid.nextPageSamples`, `body*`, `selected*` | Tsum List: last page, empty/selected slots | `src/data.ts` | used |
| `StatsRegion.slash`, `StatsRegion.scale`, `StatsSlash` | Tsum List: "5/10" and the 9px dates | `src/globals.d.ts`, `src/roundStats.ts` | used |
| `TsumListPortrait`, `TsumListRegions`, `src/tsumsCollection.dat` | Tsum List: naming, level/skill/date reads | `src/data.ts`, build, lexicon | used |
