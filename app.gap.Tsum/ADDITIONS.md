# Additions ledger

Every setting, skill or schema field added while a feature is being worked on,
and whether the finished feature still uses it. Before a feature ships, remove
everything marked **unused** (and its strings, share slot, Quick Bar wiring and
docs), then drop its rows here.

| Added | For | Where | Used |
|:--|:--|:--|:--|
| `SettingKey.SkillReactivationTenths` — "Delay Skill ReActivation" | Delay Skill ReActivation | `src/shared.d.ts`, `src/settings.ts` (Skills row, `SHARE_SLOTS`), `src/index.ts`, `src/quickbar.ts`, `src/roundStats.ts`, `README.md` | yes |
| `Tsum.skillReactivationMs`, `Tsum.skillActivatedAt` | Delay Skill ReActivation | `src/tsum.ts`, gate in `skillStillRunning` (`src/skills/skillCore.ts`) | yes |
| `UiText.SettingSkillReactivation`, `…Help` | Delay Skill ReActivation | `src/strings.d.ts`, `src/uiEn.ts`, `src/uiZhTw.ts` | yes |
| `SettingSpec.scale` — number row shown as stored ÷ scale | Delay Skill ReActivation (x.x seconds) | `src/settings.d.ts`, `src/settings.ts` (`shownNumber`) | yes |
| `SettingKey.ElsaSalvos` — "Elsa salvos" (Debug tab) | Elsa salvo count | `src/shared.d.ts`, `src/settings.ts`, `src/index.ts` → `CoronationElsaConfig.salvos` | yes |
| `UiText.SettingElsaSalvos`, `…Help` | Elsa salvo count | `src/strings.d.ts`, `src/uiEn.ts`, `src/uiZhTw.ts` | yes |
