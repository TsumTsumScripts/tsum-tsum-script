---
title: Files on the device
description: Where the log, the round stats and the screenshots land, and how to get them onto the PC from MuMu or another emulator.
---

# Files on the device

Everything the script writes lands under the app's script root on shared
storage — the same root `npm run adb` and `buildAndAdb` push into
([Build and deploy](../publishing/build-and-deploy)):

```
/sdcard/Download/GameAutomationPlatform/
```

Everything the script itself writes goes in **this device's own folder**:

```
/sdcard/Download/GameAutomationPlatform/devices/<name>_<id>/
```

`<name>` is the device's name (from the app's Settings, else its model) and
`<id>` is the twelve-hex device id, so several emulator instances sharing one
root each keep their own files instead of overwriting one another — which is
exactly what MuMu does by default. `name.txt` beside the files records the
current name, and renaming a device keeps the folder it already has.

| Where | What |
|:--|:--|
| `logs/script-<device id>.log` | The log: one JSON record per line, rotated at 2 MB into `.1.log` … `.3.log`. The id is the device's own — one emulator, one file — and ends every round `id` in the stats. At the root, not in the device folder, because the host writes it. Reading it: [Log schema](../reference/log-schema) |
| `reports/` | The zips **Save to device** in Run History writes. Also at the root: the app writes these |

And inside `devices/<name>_<id>/`:

| Where | What |
|:--|:--|
| `stats/stats_<YYYYMMDD>.csv` | The round statistics, one file per UTC day |
| `stats/tsum_list_<stamp>.csv` | What **Export Tsum list** writes |
| `stats/unread-<field>-<stamp>.png` | The score screen a stat could not be read from |
| `history/` | The last screens the router visited, numbered and named for the page it matched: `01562_GamePlaying.png`, `01563_unknown.png` |
| `reports/` | The issue-report folders, newest eight — the authority the app's zip is packed from |
| `hearts.json`, `presets.txt` | The heart tally; exported presets |
| `corpus/`, `walkthrough/` | Unrecognised screens with their sidecars, and walkthrough recordings — each behind its developer option |
| `tmp/` | Scratch: the *Debug game* frames (`…-boardImg.jpg`, `…-detectedHoughCircles.jpg`, `…-hsvImg.jpg`), the `uiautomator` dump a dialog check leaves. Safe to empty |

Names and timestamps are UTC throughout, so a stats file named for today may
be yesterday's by the PC's clock.

:::note Upgrading from an older release
Files written before this layout stay where they were, in `tsum_record/` at the
root. Nothing moves them, and nothing reads them any more — except Tsum Tsum
Stats, which scans the whole tree and so still imports the old CSVs. Delete the
old folder once you have what you want out of it.
:::

## MuMu Player 12

Nothing to pull. MuMu mounts its shared folder *as* the guest's `Download`, so
the root is already a folder on the PC:

```
C:\Users\<you>\Documents\MuMuSharedFolder\Download\GameAutomationPlatform\
```

`Documents` is wherever Windows keeps it (often under OneDrive); a shared folder
moved in MuMu's settings is under that path instead. The files are live —
open a CSV while the script plays, tail the log from there. MuMu's own toolbar
screenshot lands beside it in `MuMuSharedFolder\Screenshots`.

**Every instance mounts the same folder.** Each writes its own log — that is
what the device id in the name is for — but the stats files, `hearts.json`,
`history/` and the reports are one set for all of them, so two instances
at once will interleave their stats.

## Other emulators

The guest path is the same; the route onto the PC differs.

1. **The shared folder.** Copy from `Download/GameAutomationPlatform/…` into
   it with the guest's *Files* app. Defaults, from each emulator's own
   documentation: Nox — `Nox_share` in the user folder (guest `/mnt/shared`);
   BlueStacks 5 — `C:\ProgramData\BlueStacks_nxt\Engine\UserData\SharedFolder`
   (guest `/sdcard/windows/BstSharedFolder`), its *Media Manager* copies;
   LDPlayer — the *Shared folder* toolbar button. For a report, **Save to
   device** does the copy itself where the app recognises the emulator.

2. **adb.** Each emulator listens on a local port: MuMu 12 `127.0.0.1:16384`
   for the first instance and 32 higher per further one (its `adb.exe` is
   beside `MuMuManager.exe` under `nx_main`); Nox `127.0.0.1:62001`; LDPlayer
   and BlueStacks 5 `127.0.0.1:5555` (BlueStacks: enable *Android Debug
   Bridge* under Advanced settings).

   ```sh
   adb connect 127.0.0.1:16384
   adb pull /sdcard/Download/GameAutomationPlatform/devices .
   adb pull /sdcard/Download/GameAutomationPlatform/logs .
   ```

   A pulled directory is created *inside* the target (`./devices/`,
   `./logs/`). From Git Bash on Windows prefix `MSYS_NO_PATHCONV=1`, or the
   shell rewrites `/sdcard/…` into a path under `C:\Program Files\Git` —
   [Windows and line endings](../contributing/windows-and-line-endings).

3. **A phone** shows the folder under *Download* in the Files app and over USB
   in Explorer; **Share report** is the route for a report.

## A screenshot of your own

What the display shows right now, floating bar included:

```sh
adb shell screencap -p /sdcard/Download/screen.png
adb pull /sdcard/Download/screen.png .
```

On MuMu the first line is enough — the file appears in
`MuMuSharedFolder\Download\` as it is written. From Git Bash or cmd,
`adb exec-out screencap -p > screen.png` is the one-liner; PowerShell's `>` is
not byte-clean, so use the two-step form there.

For what the *script* saw, `history/` and the report folders are the
record; *Debug game* on the Debug tab keeps a frame of every screen the router
visits rather than the last few. The offline harness reads any of these like a
capture — [Test without a device](test-without-a-device).
