Tsum Tsum Script -- service starter
====================================

What this is
------------
General Automation Platform needs a privileged helper service running on the phone or
emulator. Android only lets a PC start that service, and it stops when the
device reboots -- so it has to be started again after every reboot.

The exception is a rooted emulator or phone: there the app can start the
service by itself, and the service options in this tool are not needed.

That is what this bundle is for. Extract it, run the file for your system --

    Windows            Start-Windows
    macOS and Linux    Start-Linux

-- then pick your device from the list and choose "Start service". The tool
remembers the device you picked and opens straight to it next time. (On a Mac
you really do run Start-Linux: macOS and Linux run the same shell, so one file
covers both. The two names may show as Start-Windows.cmd and Start-Linux.sh;
whether the ending is shown is a setting on your computer, and either way the
name in front of the dot is the one to look for.) It can also install the app,
and copy or clear the files a script leaves on the phone. It all happens in a
terminal window -- a numbered menu, the same on every platform. Nothing gets
installed on your computer, and everything in here is a plain text script you
can open and read.

The one thing the tool needs that it does not carry is Google's `adb`. The
first time it runs it asks to download it -- platform-tools @ADB_REVISION@,
about 8 to 16 MB depending on your system, straight from dl.google.com --
into an "adb" folder next to this README. The download is checked against a
checksum recorded in platform-tools.txt when this tool was built, only adb is
kept out of it, and it is never downloaded again. If a current adb is already
on your computer (Android Studio, say), the tool uses that one instead and
downloads nothing.

It does NOT install the app itself unless an "apk" folder is sitting next to
this README -- see "Installing the app" below.


macOS -- read this first
------------------------
There is no separate macOS file. Run Start-Linux.sh, the same one Linux uses --
and run it from Terminal, because double-clicking a .sh in Finder opens it in
an editor instead of running it.

macOS also blocks files that came out of a downloaded zip. Using the .tar.gz
download instead avoids that entirely:

    Open Terminal, then:
        cd ~/Downloads
        tar -xzf @ARCHIVE_NAME@.tar.gz
        cd TsumTsum-Starter
        ./Start-Linux.sh
    Files extracted this way are never quarantined, so nothing gets blocked.

If you already extracted the .zip and nothing seems to happen, run this once
in Terminal, using the folder you extracted:

    xattr -dr com.apple.quarantine "/path/to/TsumTsum-Starter"

then run  ./Start-Linux.sh  as above. (The adb the tool downloads for itself
is never quarantined -- only files that came through a browser are.)


Windows
-------
Double-click            Start-Windows

A console window opens with the menu in it. If Windows SmartScreen asks, choose
"More info" then "Run anyway" -- Start-Windows.cmd is a two-line text file and
you are welcome to open it in Notepad first.

If your workplace locks PowerShell down and Start-Windows.cmd will not run, see
"Doing it by hand" at the bottom.


Linux
-----
From a terminal:                         ./Start-Linux.sh

There is no desktop app to install and no dialog boxes: run it from a terminal
and answer the menu. (Double-clicking it in a file manager works only if your
file manager is set to run scripts in a terminal -- a terminal is simpler.)


Using it
--------
The tool is two pages, and each one says at the top what it is for and what
to do next.

1. Start your emulator, or plug the phone in with USB debugging turned on.
     - On a phone: Settings > About phone > tap "Build number" seven times,
       then Settings > Developer options > USB debugging.
     - The first time, the phone shows an "Allow USB debugging?" prompt.
       Tap Allow. Until you do, the tool lists the phone as "unauthorized".
     - Emulators (MuMu, LDPlayer, Nox, MEmu) are found automatically.
2. The first page is the device list. Type the number of your device and
   press enter.
3. The second page is that device. Its "Next:" line says what the device
   needs; usually that is "1) Start service".

After a few seconds it should say the service is running. It stays up until the
device reboots, and it survives reinstalling the app.

The device you picked stays picked: every option runs on it, and the next
time you run the tool it opens straight to that device's page. Choose "d" on
that page to go back to the list and pick another. (The choice is one line in
last-device.txt next to this README -- delete the file to forget it.)

Options 1-5 manage the service over ADB, and are only needed when the device
is NOT rooted -- a rooted emulator or phone grants the app root and the
service starts from inside the app by itself. The rest of the menu works the
same either way.

Testing a pre-release build
---------------------------
A tester is given a folder URL (or the address of its catalogue file). Run

  Start-Linux.sh --channel https://example.com/alpha/alpha.json     (macOS, Linux)
  Start-Windows.cmd -Channel https://example.com/alpha/alpha.json   (Windows)

once. It is kept in channel.txt, and option 8 then downloads that folder's
latest APK (checked against its checksum) instead of the published release. The
line it prints names the build's channel, alpha or beta. `--channel off`
(`-Channel off` on Windows) or deleting channel.txt goes back to the published
releases. A pre-release replaces the installed app; Android will not install an
older build over a newer one, so leaving it means uninstalling first.

  1) Start service         starts it, or leaves it alone if it is already
                           running from the version of the app now installed
  2) Restart               starts it again even if it was already running
  3) Stop                  stops it
  4) Show service log      what the service printed when it started
  5) Follow service log    the same log, live, until you stop it
  6) Install APK           only when an "apk" folder is in the bundle
  7) Reconnect             offered for a device that has gone offline
  8) Download latest APK   fetch the newest published APK and install it
  9) Copy the script log   copy the script log and its rotated copies into a
                           "collected" folder here
 10) Delete script log     delete it from the device, after asking, stopping
                           the service over the delete and starting it again
                           if it was running

  r) Refresh               look again: the device list, or the one device
  d) Change device         back to the device list
  q) Quit


Installing the app
------------------
If a folder named "apk" sits next to this README with .apk files in it, the
tool will offer to install the right one for your device, and an "Install APK"
option appears in the menu. Without that folder the tool only starts the
service, and will tell you if the app is missing.

When the folder holds more than one build, it lists them and preselects the one
matching the ABI the device reports:

    this device reports x86_64

      1) gap-0.13-abc1234-x86_64.apk       [enter]
      2) gap-0.13-abc1234-arm64-v8a.apk
      3) gap-0.13-abc1234-armeabi-v7a.apk

Press enter unless you have a reason not to. Choice 1 comes from the device
itself, which is more reliable than the model name on the row above it -- an
emulator can report a phone's model while running on a different processor.


Updating this tool
------------------
The tool does not update itself. Every release page offers it two ways:

    gap-starter.zip / .tar.gz            these scripts and the app
    gap-starter-scripts.zip / .tar.gz    just the scripts -- no app

To pick up a fix without downloading the app again, take the "-scripts" one
and extract it over the folder you already have, saying yes when asked to
replace files. It unpacks into a folder of the same name, so extracting it
next to the old one lands the new files exactly where the old ones were, and
your adb and apk folders stay as they are. On its own it works too: it fetches
adb the first time, the same as the full bundle does, and only lacks the
"Install APK" option.

Neither carries adb. If the new scripts pin a newer adb than the one already
in your adb folder, the one you have keeps being used -- delete the adb
folder to have the newer one fetched.


Getting the script log off the device, and clearing it
------------------------------------------------------
A script keeps its log on the device, under
/sdcard/Download/GameAutomationPlatform:

    script-<id>.log what the script logged, plus its rotated copies

Option 9 copies it to your computer, into a "collected" folder next to this
README -- one folder per device, and the layout the device had:

    collected/127.0.0.1-16384/logs/script-<id>.log

Copying again overwrites what was copied before, and nothing else is touched.

Option 10 deletes the same files from the device. It lists what it found and
asks before deleting anything -- and nothing keeps a second copy, so copy
first if you want to keep it.

The service keeps its script log open from the moment it starts, and an emulator
that maps the device's storage onto a folder on your computer will refuse to
delete a file that is still open. So option 10 stops the service first, deletes,
and starts it again if it had been running -- which means a new, empty
script log is on the device by the time it finishes. Anything the script was
doing is ended by that stop, exactly as option 3 would.

If you started the service with --root=, set GAP_STORAGE_ROOT to that same
folder before running, or the tool looks in the wrong place.

Round stats (stats_*.csv) and the Tsum Tsum Stats website are not part of this
tool; Tsum Tsum Stats is its own program and imports them itself.


When something goes wrong
-------------------------
"No device found"
    The emulator is not running, or the phone is not in USB debugging mode.
    Unusual emulator port? Set GAP_EXTRA_PORTS="12345" before starting.

"Only one of my emulators is listed"
    Each emulator instance listens on its own port, and this tool probes the
    first four of each family -- MuMu, LDPlayer, Nox and MEmu. A fifth
    instance, or one whose port you changed, needs GAP_EXTRA_PORTS.
    MuMu prints the port under Settings > Other, or run
    MuMuManager.exe adb -v <instance number>.

"unauthorized"
    Look at the phone's screen and tap Allow on the USB debugging prompt,
    then choose "r" to refresh.

"wrong ABI" / "The installed APK carries ... only"
    The installed app was built for a different processor than this device
    uses. Emulators cause this most often: one that advertises ARM as well as
    its real x86_64 can extract the ARM libraries out of an all-ABI APK, and
    the service cannot load those. Choose "Download latest APK" -- it fetches
    the build for the ABI shown in the list, which carries nothing else to
    pick wrong.

"not installed"
    Install the app first. See "Installing the app" above.

"the service on this device was started by the app itself"
    A rooted device: the app started the service as root, and nothing this
    tool runs over ADB can stop or replace what root started. It does not
    need to -- the app looks after that service, and every other option here
    (install, download, copy, delete) works as usual. After installing a new
    version, reboot the device; the app starts the new one by itself.

"Could not download it" (adb)
    The first run needs the internet, to fetch adb from dl.google.com. No
    connection, or a network that blocks Google downloads? Either set GAP_ADB
    to the full path of an adb you have, or fetch the archive named in
    platform-tools.txt on another computer, take adb out of it (adb.exe and
    its three .dll files on Windows; the file "adb" elsewhere) and put them
    in  adb/windows,  adb/darwin  or  adb/linux  next to this README.

"did not match its checksum"
    The archive Google served is not the one this tool was built against.
    Try once more; if it keeps happening, get the newest -scripts download
    (see "Updating this tool"), whose platform-tools.txt pins a current one.

"Google publishes adb for Linux on x86_64 only"
    An ARM Linux machine, such as a Raspberry Pi. Install your distribution's
    adb (apt install adb) and set GAP_ADB to its full path.

"Refusing to download without a confirmation"
    The tool was run without a terminal to ask in -- from a script, say. Add
    --yes  (-Yes on Windows), which agrees to the download in advance.

The tool replaced my ADB server
    Harmless. Android Studio, scrcpy or your emulator manager will start it
    again by themselves. To avoid it entirely, point the tool at the adb you
    already use:  set GAP_ADB to its full path.


Doing it by hand
----------------
Every menu option is also a command-line option, so nothing needs the menu:

    Start-Linux.sh start             (macOS, Linux)
    Start-Windows.cmd -Action start  (Windows)

In place of "start": restart, stop, log, follow, install, update, reconnect,
copy-script, delete-script. Add  --serial <device>
(or  -Serial <device>  on Windows) to name the device; with more than one
connected and none named, the device picked last in the menu is used. Add
--yes  (-Yes on Windows) to answer the questions in advance: the first
run's adb download, and a delete confirmation. Running it with  --help  lists
them all.

If you cannot run the scripts at all, the two commands they boil down to are:

    adb push device/gap-service.sh /data/local/tmp/gap-service.sh
    adb shell sh /data/local/tmp/gap-service.sh start

using any adb you already have. That is the whole tool.


What is in here
---------------
  Start-Windows.cmd                      the thing you run, on Windows
  Start-Linux.sh                         ... on macOS and Linux
  bin/win/*.ps1                          Windows menu (PowerShell)
  bin/posix/*.sh                         macOS and Linux menu (shell)
  device/gap-service.sh                  what actually runs on the device
  device/PROTOCOL.md                     how the two talk to each other
  platform-tools.txt                     where adb is downloaded from, and the
                                         checksum the download must match
  test/check-parity.sh                   self-test, needs no device
  adb/                                   appears on the first run: Google's adb
                                         for this computer
  collected/                             appears when you copy the log off a device
  last-device.txt                        appears once you pick a device: which one
  channel.txt                            appears once you pin a pre-release channel

No program in this bundle was compiled by us, and none is in it as downloaded.
The only binary that ever lands here is Google's adb, unmodified, fetched from
the official Android platform-tools release.
