// The trace stream: live debug data for a dev tool on the PC.
//
// The host carries `emitTrace(kind, data)` to whoever is connected to its trace
// port (21026, `gap-events.js --trace`). Nothing here is built unless someone is,
// so an unwatched run pays one host call a second. `LOGGING.md` § The trace
// stream; the host side is `../game-automation-app/docs/EVENTS.md`.

namespace Trace {
  /** Every `kind` this script traces. A consumer filters on these. */
  export const enum Kind {
    /** Every log record, debug included, whatever the Debug logs setting says. */
    Log = 'log',
    /** One board read: each tsum's cluster and centre, the cluster colours, the bubbles. */
    BoardScan = 'board.scan',
    /** The chains a batch is about to draw, as tsum centres. */
    BoardPaths = 'board.paths',
  }
}

/** How long a `traceAttached()` answer is trusted. */
const TraceCheckMs = 1000;
var gTraceOn = false;
var gTraceCheckedAt = 0;

/** Whether a trace consumer is attached. Asks the host at most once a second. */
function traceOn(): boolean {
  const now = Date.now();
  if (now - gTraceCheckedAt >= TraceCheckMs || now < gTraceCheckedAt) {
    gTraceCheckedAt = now;
    gTraceOn = typeof traceAttached === 'function' && traceAttached();
  }
  return gTraceOn;
}

/** Sends one trace if someone is watching; `build` runs only then. */
function traceSend(kind: Trace.Kind, build: () => unknown): void {
  if (!traceOn()) {
    return;
  }
  try {
    emitTrace(kind, build());
  } catch (e) {
    // A trace must never end a run. Logged as a warning, which is traced too.
    logWarn(Log.Log.TraceFailed, 'A trace could not be built', { kind: kind, errorText: '' + e });
  }
}
