#!/usr/bin/env bash
# Tsum Tsum Script service starter -- macOS and Linux.
#
# One script for both: they run the same shell, so a second copy under a .command
# name only added a file to keep in sync. A file manager can launch this from
# anywhere, and a macOS double-click starts in $HOME, so the bundle root is
# resolved from $0 rather than assumed to be the working directory.
BUNDLE="$(cd "$(dirname "$0")" && pwd)"
# So --help names the file the user actually ran.
GAP_LAUNCHER="$(basename "$0")"; export GAP_LAUNCHER
exec "$BUNDLE/bin/posix/gap.sh" "$@"
