#!/usr/bin/env bash
# Entry point for macOS and Linux. Start-Linux.sh lands here; both platforms
# run the same shell, so there is only the one launcher.
#
# With no action it opens the starter's website (gap-site.sh); --menu gives
# the terminal menu instead, and an action runs just that. Order matters below -- the quarantine strip has to happen
# before anything executes adb, because on macOS a quarantined binary is
# killed rather than refused, and the symptom looks nothing like the cause.

set -u

BUNDLE="$(cd "$(dirname "$0")/../.." && pwd)"
export BUNDLE
# For run_site to start this script again, with the same arguments, after the
# page updated the starter.
GAP_ARGV=("$@")

# --- macOS Gatekeeper, and mode bits ---------------------------------------
#
# A zip downloaded through a browser carries com.apple.quarantine, and Archive
# Utility copies the tag onto every extracted file. Left in place it blocks
# Start-Linux.sh at launch. The adb the tool downloads itself never carries
# the tag (curl does not set it), but one copied in from elsewhere might, and
# a quarantined adb is killed mid-run with no message at all. This one line
# is the difference between the tool working and the tool appearing broken.
# It is a silent no-op on Linux, where xattr does not exist.
xattr -d -r com.apple.quarantine "$BUNDLE" 2>/dev/null || true

# A zip written by tooling that does not record Unix modes extracts everything
# 0644. Repair it here rather than asking the user to chmod.
chmod +x "$BUNDLE"/adb/darwin/adb "$BUNDLE"/adb/linux/adb "$BUNDLE"/server/*/tsum-stats \
         "$BUNDLE"/bin/posix/*.sh "$BUNDLE"/device/*.sh \
         "$BUNDLE"/Start-Linux.sh 2>/dev/null || true

# shellcheck source=gap-device.sh
. "$BUNDLE/bin/posix/gap-device.sh"
# shellcheck source=gap-actions.sh
. "$BUNDLE/bin/posix/gap-actions.sh"
# shellcheck source=gap-site.sh
. "$BUNDLE/bin/posix/gap-site.sh"

CLI_ACTION=""
CLI_SERIAL=""
CLI_TCP=""
CLI_CHANNEL=""
CLI_MENU=0

while [ $# -gt 0 ]; do
  case "$1" in
    # Accepted and ignored: the terminal menu is now the only front-end, and
    # older instructions in the wild still pass these.
    --tty|--console) shift ;;
    --menu) CLI_MENU=1; shift ;;
    --serial) CLI_SERIAL="$2"; shift 2 ;;
    # Answers the questions in advance -- the delete confirmation, and the
    # first run's adb download -- for a caller with no terminal to answer in.
    --yes|-y) GAP_ASSUME_YES=1; export GAP_ASSUME_YES; shift ;;
    --tcp)    CLI_TCP="$2"; shift 2 ;;
    --channel) CLI_CHANNEL="$2"; shift 2 ;;
    start|restart|stop|log|follow|install|update|add-source|reconnect|copy-script|delete-script) CLI_ACTION="$1"; shift ;;
    -h|--help)
      printf 'Tsum Tsum Script -- service starter\n'
      printf 'Starts the helper service General Automation Platform needs to run the Tsum Tsum script on a phone or emulator.\n'
      printf '\nUsage: %s [ACTION | --menu] [--serial S] [--tcp PORT] [--channel URL|off] [--yes]\n' \
             "${GAP_LAUNCHER:-Start-Linux.sh}"
      printf '\nACTION is one of:\n'
      printf '  start         start the service, or leave a matching one alone\n'
      printf '  restart       start it even if it is already running\n'
      printf '  stop          stop it\n'
      printf '  log           print what the service logged when it started\n'
      printf '  follow        stream the service log until Ctrl-C\n'
      printf '  install       install the bundled APK for this device ABI\n'
      printf '  update        download the latest published APK and install it\n'
      printf '  add-source    ask GAP on the device to add the Tsum Tsum library\n'
      printf '  reconnect     disconnect and reconnect an offline device\n'
      printf '  copy-script   copy the script log off the device into collected/\n'
      printf '  delete-script delete the script log from the device\n'
      printf '\n--yes answers the questions in advance: it agrees to the one-time adb\n'
      printf 'download, confirms a delete, and takes the APK matching the device\n'
      printf 'instead of asking which to install.\n'
      printf '\n--channel URL pins a pre-release folder (a tester build) for `update`, and\n'
      printf 'remembers it in channel.txt. --channel off goes back to the published releases.\n'
      printf '\nWith several devices and no --serial, the device chosen last in the\n'
      printf 'menu is used (it is kept in last-device.txt beside the README).\n'
      printf '\nWith no ACTION it opens the starter website in your browser. --menu\n'
      printf 'gives the same options as a menu in this terminal instead.\n'
      exit 0 ;;
    *) printf 'unknown option: %s\n' "$1" >&2; exit 2 ;;
  esac
done

if [ -n "$CLI_CHANNEL" ]; then
  set_channel "$CLI_CHANNEL" || exit 2
elif channel_active; then
  printf 'release channel: %s\n' "$RELEASE_BASE"
fi

# The website finds its own adb, so it starts before any of that.
if [ -z "$CLI_ACTION" ] && [ "$CLI_MENU" = 0 ]; then
  run_site
  exit 1
fi

resolve_adb || exit 1
check_adb_runs || exit 1
adb_start_server

# --- one action, no menu ----------------------------------------------------
# The same work the menu does, for scripts and for anyone who would rather type.
if [ -n "$CLI_ACTION" ]; then
  if [ -z "$CLI_SERIAL" ]; then
    refresh_devices
    n="$(device_count)"
    if [ "$n" -eq 0 ]; then no_devices_hint; exit 1; fi
    if [ "$n" -gt 1 ]; then
      # Several, and none named: the one chosen last in the menu, if it is
      # among them, is the only sensible default.
      last="$(recall_device)"
      if [ -n "$last" ] && [ -n "$(row_index "$last")" ]; then
        CLI_SERIAL="$last"
        printf 'using %s, the device chosen last in the menu (--serial picks another)\n' "$last"
      else
        printf 'error: %s devices connected, pass --serial to choose one:\n' "$n" >&2
        printf '%s\n' "$DEVICE_ROWS" | cut -f1 | sed 's/^/  /' >&2
        exit 1
      fi
    else
      CLI_SERIAL="$(row_field 1 1)"
    fi
  fi
  [ -n "$CLI_TCP" ] && export GAP_TCP="$CLI_TCP"
  run_action "$CLI_SERIAL" "$CLI_ACTION"
  rc=$?
  [ -n "$ACTION_MSG" ] && printf '\n%s\n' "$ACTION_MSG"
  exit $rc
fi

# shellcheck source=gap-menu.sh
. "$BUNDLE/bin/posix/gap-menu.sh"
menu_main
