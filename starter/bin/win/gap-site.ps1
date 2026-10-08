# The starter's website -- the twin of bin/posix/gap-site.sh. Dot-sourced by
# gap.ps1, after gap-device.ps1.
#
# tsum-stats (Tsum Tsum Stats' program) serves it, started with --starter
# pointing at this folder: the starter at /starter/, the stats site at /. It is
# downloaded once into server\windows-amd64\ and checked against the pin in
# tsum-stats.txt. GAP_STARTER_SERVER names a local build instead. Windows on
# ARM runs the amd64 build under emulation.

$global:SitePinFile = Join-Path $Bundle 'tsum-stats.txt'
$global:SiteDir     = Join-Path $Bundle 'server\windows-amd64'
$global:SiteBin     = Join-Path $global:SiteDir 'tsum-stats.exe'

function Get-SitePin {
  param([string]$Key)
  if (-not (Test-Path -LiteralPath $global:SitePinFile)) { return '' }
  return Get-Kv -Text (Get-Content -LiteralPath $global:SitePinFile -Raw) -Key $Key
}

# Fetches the pinned program when it is missing or older than the pin. Asks
# first; -Yes answers for a caller with no console.
function Get-SiteProgram {
  $url     = Get-SitePin 'url_windows_amd64'
  $want    = Get-SitePin 'sha256_windows_amd64'
  $size    = Get-SitePin 'size_windows_amd64'
  $version = Get-SitePin 'version'
  if (-not $url -or -not $want) {
    Write-Log "error: tsum-stats.txt is missing or names no Windows build, so the website's"
    Write-Log "  program cannot be fetched. Extract the bundle again, set GAP_STARTER_SERVER,"
    Write-Log "  or run with -Menu for the terminal menu."
    return $false
  }
  $verFile = Join-Path $global:SiteDir 'VERSION'
  if ((Test-Path -LiteralPath $global:SiteBin) -and (Test-Path -LiteralPath $verFile) -and
      ((Get-Content -LiteralPath $verFile -TotalCount 1).Trim() -eq $version)) {
    return $true
  }

  $mb = [math]::Round(([double]$size) / 1MB)
  Write-Log "The starter's website needs its program, tsum-stats $version, and it is not here yet."
  Write-Log "  fetch : $url"
  if ($mb -gt 0) { Write-Log "  size  : about $mb MB" }
  Write-Log "  into  : server\windows-amd64"
  Write-Log "  check : sha256 from tsum-stats.txt, recorded when this tool was built"
  if (-not $global:AssumeYes) {
    $ans = Read-Host "`n  download it now? [Y/n]"
    if ($ans -and $ans -notmatch '^(y|yes)$') {
      Write-Log "Nothing was downloaded. Run with -Menu for the terminal menu."
      return $false
    }
  }

  New-Item -ItemType Directory -Force -Path $global:SiteDir | Out-Null
  $tmp = "$global:SiteBin.download"
  Write-Log "downloading tsum-stats $version ..."
  if (-not (Get-UrlToFile -Url $url -Dest $tmp)) {
    Remove-Item -LiteralPath $tmp -Force -ErrorAction SilentlyContinue
    Write-Log "Could not download it. Check the internet connection and try again."
    return $false
  }
  if ((Get-Sha256 -Path $tmp) -ne $want.ToLower()) {
    Remove-Item -LiteralPath $tmp -Force -ErrorAction SilentlyContinue
    Write-Log "The download did not match its checksum and was deleted. Nothing was kept."
    return $false
  }
  Write-Log "  sha256 ok"
  Move-Item -LiteralPath $tmp -Destination $global:SiteBin -Force
  Set-Content -LiteralPath $verFile -Value $version
  return $true
}

# Runs the website in this console and opens it; closing the console stops it.
function Start-Site {
  $bin = $env:GAP_STARTER_SERVER
  if (-not $bin) {
    if (-not (Get-SiteProgram)) { return 1 }
    $bin = $global:SiteBin
  }
  Write-Log ""
  Write-Log "Opening the starter in your browser: http://127.0.0.1:8090/starter/"
  Write-Log "Keep this window open while you use it. Ctrl+C here (or closing the window) stops it."
  Write-Log ""
  & $bin serve --starter $Bundle --open
  return $LASTEXITCODE
}
