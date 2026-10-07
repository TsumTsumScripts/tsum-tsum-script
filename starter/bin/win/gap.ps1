# Tsum Tsum Script service starter -- Windows entry point.
#
# The twin of bin/posix/gap.sh, and deliberately as small: unblock the bundle,
# load the two shared layers, find adb, then either run one action or show the
# menu. There is no window any more -- everything this bundle does is a
# terminal option, on every platform.

param(
  [string]$Serial,
  [string]$Action,
  # A pre-release folder URL for `update`, remembered in channel.txt; 'off'
  # returns to the published releases.
  [string]$Channel,
  # Answers the questions in advance -- the delete confirmation, and the
  # first run's adb download -- for a caller with no console to answer in.
  [switch]$Yes,
  # Accepted and ignored: the menu is the only front-end, and older
  # instructions in the wild still pass this.
  [switch]$Console
)

$ErrorActionPreference = 'Stop'
$Bundle = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
# Before Resolve-Adb, which may ask; gap-menu.ps1 sets it again for itself.
if ($Yes) { $global:AssumeYes = $true }

# Files extracted from a downloaded zip carry Mark-of-the-Web, which can make
# PowerShell refuse to dot-source them. Cheap insurance.
Get-ChildItem -LiteralPath $Bundle -Recurse -Include *.ps1, *.cmd -ErrorAction SilentlyContinue |
  Unblock-File -ErrorAction SilentlyContinue

. "$Bundle\bin\win\gap-device.ps1"
. "$Bundle\bin\win\gap-actions.ps1"

if ($Channel) {
  if (-not (Set-Channel -Url $Channel)) { exit 2 }
} elseif (Test-ChannelActive) {
  Write-Host "release channel: $global:ReleaseBase"
}

if (-not (Resolve-Adb -Bundle $Bundle)) { exit 1 }
Start-AdbServer

& "$Bundle\bin\win\gap-menu.ps1" -Bundle $Bundle -Serial $Serial -Action $Action -Yes:$Yes
exit $LASTEXITCODE
