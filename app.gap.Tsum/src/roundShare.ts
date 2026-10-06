// ---------------------------------------------------------------------------
// Share round stats
//
// Sends new rows of tsum_record/stats_*.csv to `Config.roundStatsUrl`. The
// script owns this; the host only provides `httpClient`. Off when the URL is
// blank, when the Share round stats setting is off, or when round stats are
// not recorded (nothing calls it then: `writeRoundStats` is the one caller).
//
// The CSV files are the queue. Each row's `id` starts with its round's UTC
// time, so remembering the last id the server accepted per file (the cursor,
// `round_share_cursor.json` beside the CSVs) is enough to know what is left.
// The cursor moves only after the server answers `{"ok": true}`, so a failure
// costs a re-send, never a loss; the server drops duplicates by id.
//
// At most one request per call and one call a minute. `httpClient` returns only
// the body ("" on a network failure), so anything but `ok: true` backs off:
// 30s, doubling, up to 30min. Nothing here may throw into the round loop.
// ---------------------------------------------------------------------------

const RoundShareSchema = 'gap.round-stats/1';
const RoundShareIntervalMs = 60 * 1000;
const RoundShareMaxRows = 50;
const RoundShareBackoffMinMs = 30 * 1000;
const RoundShareBackoffMaxMs = 30 * 60 * 1000;
const RoundShareCursorFile = 'round_share_cursor.json';

/** Per run: when the last send was tried, and the backoff after failures. */
let gRoundShareLastAt = 0;
let gRoundShareFailures = 0;
let gRoundShareRetryAt = 0;
/** An unexpected throw is logged once a run, not once a round. */
let gRoundShareThrew = false;

/** Called after a round's row is written. Sends one batch if one is due. */
function roundShareAfterRow(tsum: Tsum): void {
  if (!Config.roundStatsUrl || !tsum.sendRoundStats || !tsum.trackRoundStats) {
    return;
  }
  const now = Date.now();
  if (now - gRoundShareLastAt < RoundShareIntervalMs || now < gRoundShareRetryAt) {
    return;
  }
  gRoundShareLastAt = now;
  try {
    roundShareOnce(tsum.storagePath);
  } catch (e) {
    if (!gRoundShareThrew) {
      gRoundShareThrew = true;
      logWarn(Log.Stats.ShareFailed, 'Could not share round stats', { errorText: '' + e });
    }
  }
}

/** Forgets what was sent; turning sharing off calls this. */
function roundShareClear(storagePath: string): void {
  const path = roundShareCursorPath(storagePath);
  try {
    const text = readFile(path);
    if (text && text.trim() !== '{}') {
      writeFile(path, '{}');
    }
  } catch (e) {
    // Nothing to clear.
  }
  gRoundShareFailures = 0;
  gRoundShareRetryAt = 0;
}

function roundShareCursorPath(storagePath: string): string {
  return storagePath + '/' + Config.recordDir + '/' + RoundShareCursorFile;
}

/** One pass: the oldest file with unsent rows gets one request. */
function roundShareOnce(storagePath: string): void {
  const dir = storagePath + '/' + Config.recordDir;
  const names = execute('ls -1 "' + dir + '" 2>/dev/null').split('\n')
    .map((name) => name.trim())
    .filter((name) => /^stats_\d+\.csv$/.test(name))
    .sort();
  const cursorPath = roundShareCursorPath(storagePath);
  const cursor = roundShareReadCursor(cursorPath);
  for (const name of names) {
    const source = Config.recordDir + '/' + name;
    const batch = roundShareRows(readFile(dir + '/' + name), cursor[source] || '');
    if (batch.records.length === 0) {
      continue;
    }
    const body = JSON.stringify({
      schema: RoundShareSchema,
      script: { id: GAP_SCRIPT_ID },
      source: source,
      sentAt: new Date().toISOString(),
      records: batch.records,
    });
    const reply = httpClient('POST', Config.roundStatsUrl, body,
      { 'Content-Type': 'application/json' });
    if (roundShareAccepted(reply)) {
      // Drop files that are gone, so the cursor stays small.
      const kept: { [source: string]: string } = {};
      for (const other of names) {
        const key = Config.recordDir + '/' + other;
        if (cursor[key]) {
          kept[key] = cursor[key];
        }
      }
      kept[source] = batch.lastId;
      writeFile(cursorPath, JSON.stringify(kept));
      gRoundShareFailures = 0;
      gRoundShareRetryAt = 0;
      logInfo(Log.Stats.Shared, 'Shared round stats', { source: source, rows: batch.records.length });
    } else {
      gRoundShareFailures++;
      const wait = Math.min(RoundShareBackoffMaxMs,
        RoundShareBackoffMinMs * Math.pow(2, gRoundShareFailures - 1));
      gRoundShareRetryAt = Date.now() + wait;
      logWarn(Log.Stats.ShareFailed, 'The stats server did not accept the rows', {
        source: source,
        reply: (reply || '').substring(0, 200),
        retryInSec: Math.round(wait / 1000),
      });
    }
    return;
  }
}

/** The cursor file: source path -> last id accepted. Empty when unreadable. */
function roundShareReadCursor(path: string): { [source: string]: string } {
  try {
    const parsed = JSON.parse(readFile(path) || '{}');
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (e) {
    return {};
  }
}

/** Accepted only when the reply is JSON carrying `ok: true`. */
function roundShareAccepted(reply: string): boolean {
  try {
    const parsed = JSON.parse(reply);
    return !!parsed && parsed.ok === true;
  } catch (e) {
    return false;
  }
}

/**
 * Rows newer than `after`, keyed by the file's own header, up to
 * `RoundShareMaxRows`. A last line with no newline may be half written, so it
 * waits for the next pass.
 */
function roundShareRows(text: string, after: string): { records: { [column: string]: string }[]; lastId: string } {
  const records: { [column: string]: string }[] = [];
  let lastId = after;
  const lines = (text || '').split('\n');
  if (!text.endsWith('\n')) {
    lines.pop();
  }
  if (lines.length < 2) {
    return { records: records, lastId: lastId };
  }
  const header = statsParseCsvLine(lines[0].replace(/\r$/, ''));
  const idColumn = header.indexOf('id');
  if (idColumn < 0) {
    return { records: records, lastId: lastId };
  }
  for (let i = 1; i < lines.length && records.length < RoundShareMaxRows; i++) {
    const line = lines[i].replace(/\r$/, '');
    if (line === '') {
      continue;
    }
    const cells = statsParseCsvLine(line);
    const id = cells[idColumn] || '';
    // Ids sort by time, so a string compare is "newer than".
    if (id === '' || id <= lastId) {
      continue;
    }
    const record: { [column: string]: string } = {};
    header.forEach((column, at) => {
      if (column !== '') {
        record[column] = cells[at] !== undefined ? cells[at] : '';
      }
    });
    records.push(record);
    lastId = id;
  }
  return { records: records, lastId: lastId };
}
