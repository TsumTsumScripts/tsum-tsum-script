#!/usr/bin/env bash
# The starter's website. Sourced by gap.sh, after gap-device.sh.
#
# The page is served by tsum-stats (Tsum Tsum Stats' program), started with
# --starter pointing at this folder: the starter at /starter/, the stats site
# at /. The program is downloaded once, like adb, into server/<os>-<arch>/ and
# checked against the pin in tsum-stats.txt, which build-starter.sh copies
# from the tsum-stats release. GAP_STARTER_SERVER names a local build instead.

SITE_PIN_FILE="$BUNDLE/tsum-stats.txt"
site_kv() { kv "$(tr -d '\r' < "$SITE_PIN_FILE" 2>/dev/null)" "$1"; }

# arm64 or amd64, the two tsum-stats is built for.
site_arch() {
  case "$(uname -m)" in
    arm64|aarch64) echo arm64 ;;
    x86_64|amd64)  echo amd64 ;;
    *)             echo "" ;;
  esac
}

site_dir() { echo "$BUNDLE/server/$(host_os)-$(site_arch)"; }
site_bin() {
  case "$(host_os)" in
    windows) echo "$(site_dir)/tsum-stats.exe" ;;
    *)       echo "$(site_dir)/tsum-stats" ;;
  esac
}

# Fetches the pinned program when it is missing or older than the pin. Asks
# first; --yes answers for a caller with no terminal.
site_download() {
  key="$(host_os)_$(site_arch)"
  url="$(site_kv "url_$key")"
  want="$(site_kv "sha256_$key")"
  size="$(site_kv "size_$key")"
  version="$(site_kv version)"
  bin="$(site_bin)"
  dir="$(site_dir)"

  if [ ! -f "$SITE_PIN_FILE" ]; then
    log_line "error: tsum-stats.txt is missing, so the website's program cannot be fetched."
    log_line "  Extract the bundle again, set GAP_STARTER_SERVER to a tsum-stats you have,"
    log_line "  or run with --menu for the terminal menu."
    return 1
  fi
  if [ -z "$(site_arch)" ] || [ -z "$url" ] || [ -z "$want" ]; then
    log_line "error: the website is not built for this computer ($(host_os), $(uname -m))."
    log_line "  Run with --menu for the terminal menu."
    return 1
  fi
  if [ -x "$bin" ] && [ "$(tr -d '\r\n ' < "$dir/VERSION" 2>/dev/null)" = "$version" ]; then
    return 0
  fi

  mb=$(( (${size:-0} + 524288) / 1048576 ))
  log_line "The starter's website needs its program, tsum-stats $version, and it is not here yet."
  log_line "  fetch : $url"
  [ "$mb" -gt 0 ] && log_line "  size  : about $mb MB"
  log_line "  into  : ${dir#$BUNDLE/}"
  log_line "  check : sha256 from tsum-stats.txt, recorded when this tool was built"
  if [ "${GAP_ASSUME_YES:-0}" != 1 ]; then
    if [ ! -t 0 ]; then
      log_line "Refusing to download without a confirmation -- add --yes."
      return 1
    fi
    printf '\n  download it now? [Y/n] '
    read -r ans || ans=""
    case "$ans" in
      ""|y|Y|yes|YES) : ;;
      *) log_line "Nothing was downloaded. Run with --menu for the terminal menu."; return 1 ;;
    esac
  fi

  mkdir -p "$dir" || { log_line "error: cannot write into $dir."; return 1; }
  tmp="$bin.download"
  log_line "downloading tsum-stats $version ..."
  if ! fetch_url "$url" "$tmp"; then
    rm -f "$tmp"
    log_line "Could not download it. Check the internet connection and try again."
    return 1
  fi
  if [ "$(sha256_of "$tmp" 2>/dev/null || true)" != "$want" ]; then
    rm -f "$tmp"
    log_line "The download did not match its checksum and was deleted. Nothing was kept."
    return 1
  fi
  log_line "  sha256 ok"
  mv -f "$tmp" "$bin" && chmod +x "$bin"
  printf '%s\n' "$version" > "$dir/VERSION"
  return 0
}

# Starts the website in this terminal and opens it. Closing the terminal, or
# Ctrl-C, stops it.
run_site() {
  bin="${GAP_STARTER_SERVER:-}"
  if [ -z "$bin" ]; then
    site_download || return 1
    bin="$(site_bin)"
  fi
  log_line ""
  log_line "Opening the starter in your browser: http://127.0.0.1:8090/starter/"
  log_line "Keep this window open while you use it. Ctrl-C here (or closing the window) stops it."
  log_line ""
  exec "$bin" serve --starter "$(host_path "$BUNDLE")" --open
}
