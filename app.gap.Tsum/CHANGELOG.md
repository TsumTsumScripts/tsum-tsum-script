# Changelog

All notable changes to the Tsum Tsum script. Format based on
[Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

**One section per version, named for `package.json`'s `version`.** There is no
`[Unreleased]`: an entry goes under whatever version the package is on, and
bumping the version is what opens the next section. Cutting a release does not
close one -- `npm run release:*` publishes the section for the version it built,
and later work on that same version reopens and republishes it.

**`### Summary` opens every section, and it is the user-facing changelog.**
`npm run release:*` reads those bullets and nothing else to fill the `Message`
field of the catalogue entry -- the release note a player reads on a phone, in a
card a few lines tall. A bullet is:

- **one line**: a sentence, no sub-bullets, no wrapped paragraph;
- **one bullet per feature, not per change** -- a new skill is "Coronation Day
  Elsa skill added", and a later round of work on it is "Coronation Day Elsa
  skill improved by making clears faster". Every pass over the same feature
  folds into that one line; *how* it was done belongs in the sections below;
- about **what a player sees or does** -- a setting, a screen, a stats column,
  behaviour they would notice. If it can only be said in file, key or API names,
  it is not one;
- **never internals**: refactors, tooling, docs, detection plumbing, tests, and
  build or release machinery all stay below.

Keep the list short enough to read on that card; over `MessageMaxChars`
(`config.json`) the release refuses rather than shipping one that scrolls.

The sections under it are the internal record, for whoever works on this next:
everything that changed, user-facing or not, **one or two lines each** -- what
changed, and the one fact that explains why. Measurements, rejected designs and
long reasoning belong in the design docs (`OBSCURED_BOARD.md`, `LOGGING.md`,
`DRIVING_SCREENS.md`, `PAGE_DISPATCH.md`, `DEVELOPMENT.md`).

**Two things are filed elsewhere.** Versions before 1.0 are in
`CHANGELOG_0.x.md`. Coronation Day Elsa's entries go in `CHANGELOG_ELSA.md`
while she stays off the production build, so her work does not reach the
release note; they fold back in here when she ships.

[Unreleased]

- Tsum List export added (Chores > Tsum List > Now): writes every Tsum you own, with its level, skill level, progress to the next skill level and month acquired, to a CSV.

## [4.0b1]

### Summary

- Nightmare Before Christmas (Set) skill added.
- Stop after games setting added (General, and the Quick Bar's second page): after a set number of rounds, turn off Auto Play, pause or stop the script.
- Settings page reorganized: Skills, Round (chain limits and bonuses) and Hearts are the first three tabs, the run settings moved to General, and setting descriptions are shorter.
- Japanese (日本語) added as a language for the settings page, Quick Bar and log.
- Copy with settings list option added: a copied settings code can carry a short list of its skill type and the settings changed from default.
- Quick Bar gained a second page, switched by the dots beside Report: heart sending and one-by-one receiving, Unlock now, Copy settings code and the other bonus items; the coin readout can switch to round/run times.

### Added

- **Nightmare Before Christmas (Set)** (`SkillType.NightmareSet`, Beta). A burst
  declaring `scalesBoard`: each scan reads tsum spacing (ALT Hough, median of
  5) into `Config.boardScale`, which scales the circle pass, blurs, texture
  disc, bubble pass and link reach. Other skills skip the read and stay at 1.
- **NBC Set: Oogie Boogie's dice.** Any touch during his roll rerolls it once,
  so the play loop chaining on spent the reroll on every roll. He follows
  another character's skill seconds after the tap, never the tap itself, so
  each board scan looks for his green cut-in (new `SkillHandler.watchScan`);
  from there every touch is held, both dice are read at their fixed rest spots
  (`nbcLook`: lit top-face red, pips as dark holes in it), and a first total
  under 7 gets one mid-board tap.
- **Tsum List export** (`src/tsumList.ts`, Alpha). Sorts the collection by Date
  acquired, owned only, taps each card and writes
  `tsum_record/tsum_list_<stamp>.csv` after every page. Queued on a live run;
  from a stopped script (`SettingKey.TsumListOnly`) it exports and stops.
  Columns end in `skill_progress` (off the skill bar's fill, empty at MAX),
  `build` (`global`/`jp`) and `device` (`getDeviceName()`).
- **Tsum List naming**: by portrait first (`src/tsumsCollection.dat`, from the
  `_l` art), then by the printed name (`src/tsumNames.dat`) for art twins.
  Named 355 of 355 on emulator. Waits for the portrait to change and settle
  after a tap (`awaitCollectionPortrait`).
- **Digit reader**: a `StatsRegion` can read `/` as a field break (`slash`) and
  enlarge small text (`scale`), for the collection's 9px dates.
- **Stop after games** (`SettingKey.StopAfterGames`, `StopAfterAction`). Counted
  at the play task's tail (`countGameTowardStop`); firing or a new target resets
  the count. Auto Play off removes the `PlayRound` job; Pause calls the host's
  `pauseScript()` (Auto Play off on an older host). `LiveWhen.Now`, `neverShared`.
  Quick Bar page two's bottom row is Games and Then; its bonus chips are gone.
- `round.start` and `round.end` carry `build`, and `round.end` also `myTsum` and
  `skill`, so a live consumer can file a round without waiting for its CSV row.
- `prerelease:alpha`/`prerelease:beta` build and publish a tester build to the
  R2 folder.
- **Japanese** (`ja-JP`): `src/uiJa.ts`, `src/logsJa.ts`. Bubbles are ボム; skill,
  box and Quick Bar labels stay English, as in zh-TW.
- **Copy with settings list**: a page-only localStorage switch
  (`tsumtsumsharelisting`). The QR and paste still use only the bare code.
- **Quick Bar page two**, flipped by a toggle over Report (`.qb-side`); both
  pages share one grid area. Lvl calls `unlockLevelsNow()`; Copy code asks the
  settings page (`PageMessage.CopyShareCode`), which owns the codec. Busy chips
  sweep until answered and report by banner, through `runScriptCallback`.
- **Readout toggle** flips `<body data-readout>` between coins and times;
  `ts.runClock` counts round time at every round end for it.
- **Live Hearts toggles**: `sendHeartsAuto`/`receiveHeartsOneByOne` are
  `LiveWhen.Now`; `quickBarSyncJob` adds or removes their job.

### Changed

- **`build --adb` pushes to every emulator in `adb devices`** instead of the
  first; `--device SERIAL` still picks one.
- **Settings tabs** are Skills, Round, Hearts, Gameplay, Chores, General,
  Debug; Advanced is gone. `SHARE_TABS` covers Round, so codes carry the same
  rows. Help text cut to about one line each.
- `sortCollection` can also set "Show owned Tsums only" and returns the dialog's
  previous state; `restoreCollectionSort` puts both back.
- `collectionOffersRaise` is split out of `raiseSelectedLevelCap`.

### Fixed

- **Last-seconds edge wash no longer breaks chains.** The game washes the
  screen edges cyan ~0.55s of every second in the last 5s; edge tsums read the
  wrong colour then. `waitOutEdgeWash` spots it from the bright gaps in the
  board's edge strips and waits for the dim part before planning (max 800ms).
- **NBC Set: no touches during Oogie's roll from the skill-use loop.** The skill
  button can read full through his roll, and `while (useSkill())` takes no
  scans, so its skill and fan taps rerolled the dice; each tap now looks for
  him first (`beforeActivate`).
- **NBC Set: no 4s stall after a finished roll.** The green skull over the
  result also reads as Oogie; the wait now ends 0.5s after neither he nor a die
  is on screen (`NbcDice.goneMs`).
- **NBC Set: a die still rocking no longer triggers a reroll.** A die can
  show the wrong face at its rest spot for ~130ms before settling (a 4+6 read
  as 4+1 and thrown away); the first roll's read must now hold 250ms
  (`NbcDice.settleMs`), well inside its ~850ms before the result shows.
- **NBC Set: 5s and 6s no longer read one short on the device** (a 6 rolled
  as 5+1 was rerolled). The host's `findContours` area is the outline's
  (`cv::contourArea`), 15-20% under the pixel count the test harness used, so
  the smallest pip fell under `pipMinRel`, and the device's capture draws pips
  about a pixel smaller than a screen recording does, so 7s were still read
  as 6 and rerolled. Now `pipMinRel` 0.006 / `pipMinFill` 0.45, which hold
  with every pip shrunk a pixel; the harness shim traces outlines the same
  way. Temporarily, each first roll's capture is saved to
  `<storage>/tmp/nbc-dice-*.png` (`nbcSaveRoll`) to confirm on device.
- **NBC Set: tsum size follows Oogie's dice.** The scale stays 1 until his
  first roll, then may only shrink after 7+ and only grow after under 7
  (`Tsum.boardScaleTrend`), over a 9-read median. With the direction fixed
  the 0.04 dead-band and the snap to 1 above 0.92 went: the scale takes the
  nearest 0.05 step once 3 reads are in, where a 0.9 → 0.85 shrink had
  waited 8s. On a size sitting near a
  step the free read flipped 0.9/1 up to 13 times in 10s; the radius read
  for sparse boards is only used while growing, since it reads low mid-clear.
- **NBC Set: front-face pip no longer counted** (a 3 read as 4): top-face pips
  sit in the top 70% of the die's box (`NbcDice.pipMaxY`).
- **NBC Set: board scale recovers on a sparse board.** Under 25 clean circles
  the spacing read gave up, so after Oogie's wipe refilled at full size the
  board stayed read at 0.85 for 30s; 8-24 circles now go by median radius
  (`BoardScaleRead.minRadiusCircles`).
- **NBC Set: Sally no longer clusters with Jack and Zero.** Her blue face and
  red hood blurred to a pale colour at the 22px colour blur; the skill now
  declares `colorBlur: 15` (`SkillHandler.colorBlur`), so white chains stop
  routing through her. Other skills keep 22.
- **Quick Bar skill name ellipsises at the 5>4 chip's edge** (`.qb-cell-fit`)
  instead of widening its column and squeezing the Report button.

## [3.2]

### Summary

- Disney Villains (Set) rounds now record score and coins in the stats file, and work with Auto Unlock MyTsum Level.

### Fixed

- `TsumLevelUpSingleTsum` moved two probes off the icon column and the "x2"
  badge. Villains (Set)'s level-up read as unknown, so base coins were never
  sampled and the tally wait gave up with the panel still up: every stats field blank.
- `LevelUpMyTsumCard`: lone-card padlock read at top + 104 (was 119, below the
  lock) and column x 511 (515 was the lock's edge). A capped single-tsum party was
  never seen, so Auto Unlock MyTsum Level never raised it.

## [3.1]

### Summary

- Sending hearts through the ranking is faster, and hearts sent without a "Heart sent!" popup are now counted.
- Disney Villains (Set) now plays properly.

### Changed

- **Faster heart sweep.** `dragList` settles on `settleScreen` instead of a
  fixed 900ms rest (mail scrolls too), and the extra 400ms rest after each
  friend-list scroll is gone. A send whose toast never shows (~6% on BlueStacks,
  each ~5s of polling) now ends once its row turns blue, and is counted. The
  row turns blue ~0.5s before the toast, so that wait is `HeartNoToastPolls`,
  and a screenful that reads empty after sending clears any late toast before
  scrolling past its rows.

### Fixed

- `checkSkillReadiness` reads Far while the bottom chrome is green or purple
  smoke. Villains (Set)'s smoke read Active at the button, so `while (useSkill())`
  re-fired every ~300ms and drew no chains for up to 9s per window. The Quick
  Bar's grey strip hides that chrome, so the side margins at y 1700 back it up.

## [3.0]

### Summary

- Wait for Settle setting added: once the gauge fills, waits up to 0.0-3.0s for the board to refill before firing the skill, so it goes off on a full board.
- Delay Skill ReActivation setting added: holds a full gauge for a set time after each activation so a skill with a duration is not wasted.
- Bubbles are no longer popped the moment they appear or right after a skill fires; the Bubble Strategy spends them once the board has refilled.
- The next round starts about 3 seconds sooner after the score tally, with its count-up skipped whether or not round stats are on.
- Box Buying can buy the Pick-Up Capsule, and no longer stalls on a box's reveal card while the Quick Bar is up.
- Gaston and Coronation Elsa skills are now available.
- Fixed Unlock Level and Box Buying repeating back to back instead of waiting their set hours, and Unlock Level missing capped Tsums when the collection opened past its first page.

### Added

- **Wait for Settle** (`SkillSettleMs`, stored in ms, shown in seconds via row
  `scale`). `useSkill` runs `settleBoard` before the activation tap; its
  `onMoving` callback pops bubbles into a refilling board. With it on,
  `bareTapActivates` skills read the gauge instead of blind-tapping.
- **Delay Skill ReActivation** (`skillReactivationTenths`): `skillStillRunning`
  refuses an activation within it of `useSkill`'s last tap.
- **`BoxType.Capsule`**: shares the limited tab with the Select Box, told apart
  by `BoxStore.capsuleIcon`. Buys singly; the reveal loop closes the tsum card,
  the item GET! (`EventGift`) and Last Prize (`EventGiftLastPrize`).
- **`src/chainCounter.ts`** reads the game's own chain counter mid-drag, in
  every colour it is drawn in, against sprite-rendered `ChainDigits`.

### Changed

- **Scaled number rows** show one decimal, step by 0.1 and open a decimal keypad.
- **Tally count-up tap is a dispatch handler** (`dismiss.tallyCountUp`), so it
  fires on any look at the tally, stats on or off. `readTallyRow` reads the
  button row, medals and Play off one frame; the tap retries after 400ms.
- **Bubble holds**: `holdAfterSkillMs` (2s from the activation tap, blind taps
  included) replaces `settleScansAfterSkill`; a bubble is held `minAgeMs` after
  first seen, and the unripe release is per bubble (`unripeReleaseMs`).
- **Gaston rewritten**; per-recording evidence is in the commit log.
  - Window: opens no earlier than `openFloorMs`, plays two cancelled passes
    cut to even slots, then a closing chain timed off the antlers (`antlerMs`,
    up to `closeChainMax`, retried under `gaugeChain`), then spams the button
    until the gauge fills and opens the next window (`afterActivate`,
    `stillRunning`).
  - Route: longest crossing-free path (`gastonNeighbors`, `hopReach` 1.6) over
    the tsums a finger on the head paints (`gastonFloorRead`), from the higher
    end; the colour cluster less the carry is the fallback. Dead and lookalike
    heads (`strayPaint`) are lifted and another start tried.
  - Drag: 30ms a tsum; stalls found from the coins and the chain counter, walked
    back, restarted from the far end or replanned; cancelled chains release at
    a stall past `stopFrom`.
  - Bubbles: a second Hough over the bowl bottom, a gold-icon test at the rim,
    HUD buttons excluded; each cancel taps all known bubbles but one
    (`bubbleReserve`, `bubbleEarnChain`, `surplusBubbles`).
  - Leftovers: crowded boards and the first window also clear other colours
    (`gastonClearLeftovers`, `gastonPaintedLeftovers`).
  - Play-loop rules (`chainLimits`, `readsChainCounter`) start at his first
    activation; windows play to the round's end.
  - Removed: the corner snake, the palette, fever dodges, paced moves, and the
    Debug-tab experiments.
- **`build --adb`** pushes to the first emulator in `adb devices`.

### Fixed

- **Play job due right after a round** (a job may return `true`), so the
  finished tally no longer sits 3s before Play.
- **Unlock Level and Box Buying no longer loop**: `taskBody` drops their "ran"
  `true`, which the scheduler read as "due again".
- **Level-cap rewind waits for the grid** (`awaitCollectionLoaded`); placeholder
  cards had passed the first-page check on any page.
- **Box reveals close under the Quick Bar**: `ClosePage` presses Close too.
- **`globals.d.ts` declares only real host natives** (12 phantoms dropped); one
  threw mid-drag with the finger down. `gastonLinkChain` lifts it on any throw.
- **Native images released on a throw** in `buildBoardGray`, `tiaraCapture` and
  `scanBoardQuick`.

## [2.1b2]

### Summary

- The script no longer sits on the game's pause menu flipping the Gyro switch when a chore starts during a round; the chore waits for the round instead.
- Max round duration: once it stops playing a long round it now waits for the game over screen however long that takes, instead of picking the round back up after a few minutes.

### Fixed

- **A capped round is left alone until it ends.** Coasting gave up after three
  minutes and handed the task back, and the next pass found the board still up,
  restamped the clock and played on -- so a round the cap had stopped was played
  again in stretches for hours. The give-up is gone: a coast ends only on game
  over or a stop, and `play.roundCoasting` (`ranMs`, `coastedMs`) goes out once
  a minute so a long one is visibly alive. `play.roundCoastGaveUp` is retired.

- **The pause menu's Gyro toggle is no longer tapped once a second.**
  `Page.GamePause.back` sat on the Gyro switch (318,1078), and `PageRoutes`
  declared it an exit, so a `navigate` with any goal but the board -- the
  mailbox or heart chore starting while a round was up, which only stood aside
  for the pause menu -- pressed Pause and then toggled the gyro every pass until
  the stall guard restarted the game (`gyro_stuck.mp4`). The pause menu now
  declares no exit (its other buttons forfeit the round), `back` names To Home
  Screen, and every chore stands aside for a round in progress through
  `roundInProgress` (`src/pages.ts`), logged as `task.stoodAside`.

## [2.0]

### Summary

- Version bump from 1.0 to 2.0
- "Auto Unlock MyTsum Level" setting added: when the level-up screen after a round shows "Raise level cap!" on your MyTsum, the script buys that one raise from the Tsum list and plays on.
- "Hold bubbles last fever seconds" setting added: leaves bubbles alone while a fever is about to end, so they are there to pop into the first chains after it and start the next fever sooner.
- Bubbles are popped once tsums have refilled around them, so one a burst skill leaves is no longer spent on the empty space it left.
- Skip Ruby now works like Skip Medals: rubies are left in the mailbox and the mail under them is still taken, instead of the chore stopping at the first ruby.
- Skip Medals / Skip Ruby no longer open the last mail on a scrolled screen, which on a full medal box left the chore opening the same medal over and over.
- Box Buying no longer stalls on the "You got a Patch!" popup a purchase can come with: it is closed like the reveal card and the sweep goes on.
- Box Buying handles the store refusing a 10-Time purchase on a nearly empty box ("You can't use 10-Time Purchases"): the sweep ends there instead of retrying into it, and the new "Ten, then one until sold out" size carries on singly to empty the box. "Buy ten at a time" became the "Boxes per purchase" dropdown.
- Auto launch finds the Japan game on its own: whichever build is installed is the one started, so nothing has to be set for it. The stats CSV gains a `build` column.
- The selected tsum is named as the running game prints it: in English on the international game, in Japanese on the Japan game.
- The JP game's Magical Time offer is now recognised and cancelled like the EN one.
- Debug tab: a Detect MyTsum button reads which tsum the pre-round screen shows selected, without playing a round.
- Rounds turn over faster: the score tally's count-up is tapped through instead of waited out.
- Round stats: a medal count with a 0 in it is no longer left blank.

### Added

- **`SettingKey.AutoUnlockMyTsumLevel`** (Chores tab, Beta). `record.myTsumLevelCap`
  reads the level-up panel's first card off `LevelUpMyTsumCard` (`src/data.ts`):
  the card is found by scanning the gutter column for panel blue -- the stack
  is still bouncing into place on the frame the router first names, and a
  fixed row read the "Lv" text as the padlock -- and the padlock's white body
  read at its middle. `raiseMyTsumLevelCapIfPending` (`src/levelCap.ts`) runs
  from the play task's tail: to the collection, the greyed "MyTsum Set" button
  proves the panel shows the MyTsum, then the sweep's own raise
  (`raiseSelectedLevelCap`, split out of `raiseCardLevelCap`). A failed raise
  holds the next attempt off for 30 minutes. Live (`LiveWhen.Now`). Proven
  on 14 level-up and 3 collection frames through the bundle; not yet on a
  device -- `unlock.myTsum.*` is what to read.
- **`SettingKey.HoldBubblesLastFeverSec`.** A hold over every Bubble Strategy
  rather than a fourth entry: `bubbleTapBudget` answers 0 while
  `bubblesHeldForFever` (`src/board.ts`) holds, and the All ASAP blind sweep
  stands down too; the strategy resumes when `gFever` calls the fever over.
  Live (`LiveWhen.Now`), shared, a stats column, and a Run order chip.
  `bubble.held` logs each refused pop with the fever's remaining ms.
- **`Tsum.feverRemainingMs` (`src/fever.ts`), `FeverBar` (`src/data.ts`).**
  How long a fever has left, off a ~2.4ms crop of the bar's fill taken per
  pop, the way `checkSkillReadinessFast` reads the gauge -- twenty samples at
  y=1670, lit above a value of 150, each worth 500ms. Read at the moment it
  is asked rather than estimated from the watcher's last look, so a fever the
  game has paused under a skill animation reads as paused. Gated on
  `gFever.active`, because an ordinary full gauge is just as bright. Measured
  on the six corpus fever frames.
- **`Tsum.gameBuild` (`src/appLifecycle.ts`), `GameBuild` (`src/globals.d.ts`).**
  Which build this device plays: the one in front (`focusedGameBuild`, off the
  same `dumpsys window` line `isAppOn` reads, now shared as `focusedPackage`),
  else the one last seen in front, else the one installed (`installedGameBuilds`,
  one `pm path` per package, at most once a run). Both or neither installed
  answers global. `app.build` logs the installed-package read.
- **`BoxTenTimeRefused` (`src/data.ts`).** The "You can't use 10-Time
  Purchases" toast, `targeted` like `LevelCapRaised` because it is the
  `HeartSent` sprite -- a sweep over it answers `HeartSent` -- with one probe
  in the gap between its two lines of wording that refuses both twins.
  Authored on two frames cut from `no_more_10box.mp4`. `Tsum.awaitBoxDialog`
  (`src/boxes.ts`) watches for it beside the purchase confirmation after a
  10-Time press, taps it away, and `buyOneBox` reports `tenRefused`.
- **`BoxPurchaseSize` and `SettingKey.BuyBoxSize` (`src/shared.d.ts`).** One,
  Ten, or TenThenOne, replacing the `buyBoxTenTimes` switch; `loadSettings`
  carries a stored `true` over to Ten once. `buyBoxes` reads it into the
  `tenTimes` it already ran on, which the refusal clears under TenThenOne.
  `Log.Box.TenRefused` records the refusal; `Log.Box.End` reports
  `10-time refused` when it ended the sweep.
- **`BoxPatchPurchasedPage` (`src/data.ts`).** The "You got a Patch!" popup,
  a `patch` configuration of `BoxPurchasedPage`, so `clearBoxReveals` taps
  its Close. The reveal card's entries missed it on the two probes that read
  that card's lit backdrop, which is near-black here; the loop then tapped
  its blind advance point for the whole reveal budget. Authored on a frame
  cut from `premium_plus_badge.mp4`.
- **`MagicalTimeJp` (`src/data.ts`).** The JP build draws the dialog at the
  pre-2025 position with three footnote lines under the buttons; the pre-2025
  entry missed it on its Cancel probe, which reads the wider キャンセル glyphs.
  Probes on the flat button ends either side of the text, and a foot probe
  below where the EN panel ends so the two entries stay apart.

### Changed

- **Skip Ruby** (`receiveHeartsSkipRuby`) goes through the row walk Skip Medals
  built: `mailRowToOpen` reads every found row at each badge its switch turned
  on, opens the first row carrying none, and answers `MailAllSkipped` (was
  `MailAllMedals`) when the screenful is all skipped mail, which scrolls on. The
  fixed ruby probe and the idle-out it forced are gone from the loop.
  `gifts.receiveOne.skipRuby` marks each row stepped past;
  `gifts.receiveOne.medalsOnly` is `gifts.receiveOne.skippedOnly`.
- **The Bubble Strategy pops only bubbles worth popping.** `findGameBubbles`
  counts each bubble's `near` -- the scan's tsum circles within
  `GameBubbleConfig.blastReach` past its edge -- and `popGameBubbles`' default
  path takes only those at `minTsumsInBlast` or more, richest first
  (`ripeGameBubbles`, `src/board.ts`), leaving the rest for the next scan. A
  Burst activation is a blind tap that never arms `settleScansAfterSkill`, so
  the bubble it left was tapped in the hole it sat in. Bounded by
  `unripeHoldScans` (`bubbleUnripeScans`, counted per scan) so a misread cannot
  park one; a skill's explicit limit still takes every bubble. `bubble.unripe`
  logs a refused pop, and `bubble.found` / `bubble.popped` carry `near` / `held`.
- **`src/tsums.dat` is `v2`: a name column per build.** English and Japanese
  side by side, blank where that build's pack has no strip (84 Japanese-only,
  38 with neither). `myTsumLoadLibrary` refuses a v1 file; `selectedTsum` names
  the match by the build in front, falling back to the other column, then the
  id. `tsums.identified` / `tsums.detected` carry `build`.
- **`detectMyTsum` (`src/roundStats.ts`).** The Debug tab's Detect button,
  reached by name through `runScriptCallback` like `reportIssue`. Refuses a
  live run (the loop reads the same screen itself), else builds a throwaway
  `Tsum` on the page's settings for the geometry, sleeps
  `DetectMyTsumSettleMs` for the closed panel to leave the frame -- the host
  captures every window -- and answers the `MyTsumSelection` or a
  `DetectMyTsumRefusal` (`src/shared.d.ts`) as JSON. `tsums.detected` is its
  own event so a log reader cannot take a press for a round's read; the
  banner carries the name with score and margin.
- **`askDetectMyTsum` / `onMyTsumDetected` (`src/settings.ts`).** Closes the
  panel the way the Now buttons do, sends the form, and words the answer under
  the row (`tpl-detect`) in the page's language, so it is there when the
  panel is reopened.
- **`skillWaitOutEndingFever` reads its fill geometry off `FeverBar`** instead
  of its own 345/733 constants; the measured fill runs 350-705, so the
  "nearly over" mark moves by a few px.
- **`waitForScorePage` taps the tally through its count-up
  (`src/roundStats.ts`).** A tap skips the animation and the game draws the
  final figures with the button row at once; the tap is retried every
  `StatsSkipTapMs` while the row is missing, at the spot the overlay tap already
  uses (`StatsBlindTapSpot`, was `StatsUnknownTapSpot`), which is inert on the
  finished tally and on every panel that can drop over it. Only on a look that
  named the tally, so a panel in front is still cleared by its own handler
  first. `stats.tallySkipped` records the taps and how long the row took.

### Removed

- **`SettingKey.JpVersion`.** Its row had been commented out since the public
  release, so `startApp` always launched the international package and a
  Japan-only device never came up. Launch, the force-stops, `selectedTsum`, the
  stats CSV (`build` column, in place of `jpVersion`), the report manifest
  (`script.build`) and the corpus sidecar (`build`; `load.js` still reads
  `isJP` off old ones) all take `gameBuild()` instead. `Tsum`'s constructor
  loses its first argument.

### Fixed

- **A fever is recognised on the 2025 layout.** `FeverProbes`' two
  dimmed-chrome pixels sat under the gauge, and on MuMu that build ends the
  game in a black band there, so `isFeverTime` was false on every frame and
  `gFever` never went active on that device -- the new bubble hold could not
  engage, and the "No skill last fever seconds" hold-off, whose own backdrop
  probe at (340,310) lands on that layout's gem icon, had never fired either.
  Both now read the chrome beside the score capsule, where
  `LevelUpDimmedChrome` reads; the ring thresholds go to 100 for the same
  frames. Measured on three of the device's own trail frames, filed in the
  corpus as `mumu-360x640-fever*`.
- **`renderPage` now drops `reportPanel` with the other panels.** A language
  change re-renders `#tabPanels`, and the Report row's panel was the one still
  pointing at the detached copy.
- **A scrolled mail list no longer opens the row under the Claim All bar.**
  `MailList.scroll` lands the rows half a pitch out of phase, where the last
  row's Check button is whole but its badge is under the bar -- so the medal
  probe read the bar's cyan, the row went as a heart, and with the medal box
  full the pass tapped the same medal over and over (a JP recording).
  `mailRowToOpen` now leaves a row whose deepest probe falls past
  `MailList.buttonColumn.toY` for the next scroll (`gifts.receiveOne.rowUnderBar`).
  `toY` is 1340, the last list pixel: at 1345 the scan's last sample sat on
  the bar, so a button it cut never registered as clipped. Reproduced offline
  by shifting the medals corpus frame.
- **A medal count with a `0` in it reads.** The tally's medals row draws its
  glyphs 19px tall on the 540 emulator where the coin row's are 20, and at that
  height the `0` led `9` by 0.029 -- a thousandth under `StatsMinGlyphMargin`
  -- so 401, 380 and 400 all went to the CSV blank. `StatsDigits` recut with
  two of those tallies in the sample; the worst lead over the corpus is 0.036.

## [1.0]

### Summary

- Version bump from 0.13 to 1.0

### Changed

- **Log sentences shortened.** Every `message` is written to the log file
  verbatim and the `event` id already names what happened, so the English and
  zh-TW catalogues now carry short phrases; the explanations moved out of the
  log line.
