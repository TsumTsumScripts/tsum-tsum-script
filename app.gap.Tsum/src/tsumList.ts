// ---------------------------------------------------------------------------
// The Tsum List export: every tsum the player owns, off the collection screen,
// into <storage>/tsum_record/tsum_list_<YYYYMMDD-HHMMSS>.csv.
//
// The collection shows eight cards a page, each with the month it was acquired
// under its portrait; tapping one fills the detail panel above with its level
// and skill. So the walk is:
//
//   sort by Date acquired, owned tsums only  (sortCollection, levelCap.ts)
//   rewind to the first page                 (rewindCollection)
//   per page: read which slots hold a card and each card's date, then tap each
//   card and read the panel -- level, skill, and the big portrait, which names
//   the tsum against its own library (`TsumListPortrait`, data.ts)
//   next page until a slot is empty or there is no next chevron
//   put the player's order back
//
// Reading changes nothing, so plain page turns are safe (DRIVING_SCREENS.md
// § 6). The CSV is rewritten after every page, so a run stopped halfway keeps
// what it read. A field that cannot be read is written empty rather than
// guessed; a portrait that names no tsum is saved beside the CSV so the
// library can be extended from it.
// ---------------------------------------------------------------------------

/** 797 tsums is 100 pages; a runaway guard. */
const TsumListMaxPages = 150;
/** Taps on one card, or one page chevron, before giving up on it. */
const TsumListAttempts = 3;
/** Reads of one panel number before it counts as unreadable. */
const TsumListNumberReads = 3;
const TsumListColumns = ['order', 'tsum', 'name', 'level', 'level_cap', 'skill', 'skill_max', 'acquired'];

/** The collection library, loaded on first use. */
var gTsumListLibrary: MyTsumEntry[] | null = null;

function tsumListLibrary(): MyTsumEntry[] {
  if (gTsumListLibrary === null) {
    gTsumListLibrary = myTsumLoadLibrary(TsumListPortrait.library, false);
  }
  return gTsumListLibrary;
}

/** What each of the eight slots holds, off one capture. */
Tsum.prototype.readCollectionCards = function() {
  const g = CollectionGrid;
  const points: Coord[] = [];
  for (let i = 0; i < g.cells.length; i++) {
    for (let j = 0; j < g.bodySamples.length; j++) {
      points.push({x: g.cells[i].x + g.bodySamples[j].dx, y: g.cells[i].y + g.bodySamples[j].dy});
    }
  }
  const cards: CollectionCardState[] = [];
  const img = this.screenshot();
  try {
    const read = this.getColors(img, points);
    for (let i = 0; i < g.cells.length; i++) {
      let blue = 0;
      let gold = 0;
      for (let j = 0; j < g.bodySamples.length; j++) {
        const c = read[i * g.bodySamples.length + j];
        if (isSameColor(g.bodyColor, c, g.bodyDiff)) {
          blue++;
        } else if (isSameColor(g.selectedColor, c, g.selectedDiff)) {
          gold++;
        }
      }
      cards.push(gold >= g.bodyVotes ? 'selected' : blue >= g.bodyVotes ? 'card' : 'empty');
    }
  } finally {
    releaseImage(img);
  }
  return cards;
}

/**
 * A card's acquisition month as "YYYY-MM", or '' when unread. Read under each
 * of `TsumListRegions.dateReads` until two agree -- see that table for why.
 */
Tsum.prototype.readCardDate = function(slot) {
  const d = TsumListRegions.date;
  const cell = CollectionGrid.cells[slot];
  const seen: {[date: string]: number} = {};
  const reads = TsumListRegions.dateReads;
  for (let i = 0; i < reads.length; i++) {
    const r = reads[i];
    const got = this.readStatsNumbers({
      name: 'tsum date', x: cell.x + d.dx, y: cell.y + d.dy, w: d.w, h: d.h,
      lo: [r.lo, r.lo, r.lo], hi: [255, 255, 255], slash: true, scale: r.scale
    });
    if (got === null || got.length !== 2 || got[0] < 2014 || got[0] > 2099
        || got[1] < 1 || got[1] > 12) {
      continue;
    }
    const date = got[0] + '-' + (got[1] < 10 ? '0' : '') + got[1];
    seen[date] = (seen[date] || 0) + 1;
    if (seen[date] === 2) {
      return date;
    }
  }
  return '';
}

/** A panel "now/max" pair, read until the same value comes back twice. */
function tsumListReadPair(ts: Tsum, region: StatsRegion): number[] | null {
  let last: number[] | null = null;
  for (let i = 0; i < TsumListNumberReads; i++) {
    const got = ts.readStatsNumbers(region);
    if (got !== null && got.length === 2 && got[0] <= got[1]) {
      if (last !== null && last[0] === got[0] && last[1] === got[1]) {
        return got;
      }
      last = got;
    }
  }
  return null;
}

/** The detail panel's level and skill, each `[now, max]` or null. */
Tsum.prototype.readTsumDetail = function() {
  const r = TsumListRegions;
  // The level row moves right to make room for the raise-cap padlock.
  const dx = this.collectionOffersRaise() ? r.levelCappedDx : 0;
  const level = Object.assign({}, r.level, {x: r.level.x + dx});
  return {level: tsumListReadPair(this, level), skill: tsumListReadPair(this, r.skill)};
}

/** Name the detail panel's portrait against the collection library. */
Tsum.prototype.identifyCollectionTsum = function() {
  const lib = tsumListLibrary();
  if (lib.length === 0) {
    return null;
  }
  const sig = this.myTsumSignature(TsumListPortrait.icon);
  if (sig === null) {
    return null;
  }
  const match = myTsumMatch(sig, this.gameBuild(), lib);
  if (match === null) {
    return null;
  }
  return {
    short: match.short,
    full: match.full,
    build: match.build,
    score: match.score,
    margin: match.margin,
    confident: match.score >= TsumListPortrait.minScore && match.margin >= TsumListPortrait.minMargin
  };
}

/** Save the detail panel's portrait crop, for a tsum the library could not name. */
Tsum.prototype.saveCollectionPortrait = function(path) {
  const rect = TsumListPortrait.icon;
  const from = this.toRealXY(rect.from.x, rect.from.y);
  const to = this.toRealXY(rect.to.x, rect.to.y);
  const img = getScreenshotModify(from.x, from.y, to.x - from.x, to.y - from.y, 0, 0, 100);
  if (!statsImageOk(img)) {
    return;
  }
  try {
    saveImage(img, path);
    logDebug(Log.TsumList.PortraitSaved, {path: path});
  } finally {
    releaseImage(img);
  }
}

/**
 * Select the card in `slot` and read the panel. The card turning gold is the
 * proof the tap took; a tap swallowed by an animation is tried again.
 */
Tsum.prototype.readCollectionCard = function(slot, order, date, shotDir) {
  let selected = false;
  for (let i = 0; i < TsumListAttempts && !selected && this.isRunning; i++) {
    this.tap(CollectionGrid.cells[slot]);
    this.settleScreen(UnlockSelectSettleMs);
    selected = this.readCollectionCards()[slot] === 'selected';
  }
  const row: TsumListRow = {
    order: order, tsum: '', name: '', level: null, levelCap: null,
    skill: null, skillMax: null, acquired: date
  };
  if (!selected) {
    logWarn(Log.TsumList.CardMissed, 'A card would not select; its row has only the date',
      {order: order, slot: slot});
    return row;
  }
  const detail = this.readTsumDetail();
  if (detail.level !== null) {
    row.level = detail.level[0];
    row.levelCap = detail.level[1];
  }
  if (detail.skill !== null) {
    row.skill = detail.skill[0];
    row.skillMax = detail.skill[1];
  }
  const id = this.identifyCollectionTsum();
  if (id !== null && id.confident) {
    row.tsum = id.short;
    row.name = id.full;
  } else {
    const path = shotDir + '/unnamed_' + order + '.png';
    this.saveCollectionPortrait(path);
    logInfo(Log.TsumList.Unnamed, {
      order: order,
      best: id === null ? null : id.short,
      score: id === null ? null : +id.score.toFixed(3),
      margin: id === null ? null : +id.margin.toFixed(3),
      path: path
    });
  }
  logDebug(Log.TsumList.CardRead, row as unknown as LogFields);
  return row;
}

/** The CSV, whole: the header and every row so far. */
function tsumListCsv(rows: TsumListRow[]): string {
  const cell = function(v: number | null): string {
    return v === null ? '' : String(v);
  };
  const lines = [TsumListColumns.join(',')];
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    lines.push([String(r.order), statsCsvField(r.tsum), statsCsvField(r.name), cell(r.level),
      cell(r.levelCap), cell(r.skill), cell(r.skillMax), r.acquired].join(','));
  }
  return lines.join('\n') + '\n';
}

/**
 * The export. Returns false only when it stood aside for a round in progress,
 * which the Now queue retries; anything else is done, however it ended.
 */
Tsum.prototype.taskExportTsumList = function() {
  if (roundInProgress()) {
    return false;
  }
  const stamp = statsFileStamp(new Date());
  const base = this.storagePath + '/' + Config.recordDir + '/tsum_list_' + stamp;
  const csvPath = base + '.csv';
  logInfo(Log.TsumList.Start, {file: csvPath});
  this.banner('Exporting the Tsum list', 4000);

  gPages.navigate(PageName.TsumsPage);
  if (!this.awaitPage(PageName.TsumsPage, UnlockReturnWaitMs, Log.TsumList.PageMissed)) {
    logInfo(Log.TsumList.End, {tsums: 0, reason: 'no collection'});
    return true;
  }
  const previous = this.sortCollection(CollectionSort.DateAcquired, true);
  if (previous === null) {
    logInfo(Log.TsumList.End, {tsums: 0, reason: 'sort failed'});
    return true;
  }
  this.rewindCollection();

  const rows: TsumListRow[] = [];
  let unnamed = 0;
  let reason = 'page limit';
  let pages = 0;
  for (let page = 0; page < TsumListMaxPages && this.isRunning; page++) {
    pages = page + 1;
    this.awaitCollectionLoaded();
    const cards = this.readCollectionCards();
    const dates: string[] = [];
    for (let slot = 0; slot < cards.length; slot++) {
      dates.push(cards[slot] === 'empty' ? '' : this.readCardDate(slot));
    }
    let ended = false;
    for (let slot = 0; slot < cards.length && this.isRunning; slot++) {
      if (cards[slot] === 'empty') {
        ended = true;
        break;
      }
      const row = this.readCollectionCard(slot, rows.length + 1, dates[slot], base);
      if (row.tsum === '') {
        unnamed++;
      }
      rows.push(row);
    }
    try {
      writeFile(csvPath, tsumListCsv(rows));
    } catch (e) {
      logWarn(Log.TsumList.WriteFailed, 'Could not write the Tsum list', {file: csvPath, errorText: String(e)});
    }
    logInfo(Log.TsumList.PageRead, {page: pages, tsums: rows.length});
    if (ended || this.collectionAtLastPage()) {
      reason = 'end of list';
      break;
    }
    // A page turn is proved by the first card's portrait changing; a tap that
    // landed mid-animation turns nothing.
    const before = this.myTsumSignature(tsumListCellRect(0));
    let turned = false;
    for (let i = 0; i < TsumListAttempts && !turned && this.isRunning; i++) {
      this.tap(CollectionGrid.nextPage);
      this.settleScreen(UnlockPageTurnSettleMs);
      const after = this.myTsumSignature(tsumListCellRect(0));
      turned = before === null || after === null || myTsumSimilarity(myTsumPrepare(before), myTsumPrepare(after)) < 0.98;
    }
    if (!turned) {
      logWarn(Log.TsumList.PageTurnMissed, 'The collection would not turn the page', {page: pages});
      reason = 'page turn failed';
      break;
    }
  }

  if (!this.isRunning) {
    reason = 'stopped';
  }
  this.restoreCollectionSort(previous, CollectionSort.DateAcquired);
  logInfo(Log.TsumList.End,
    {tsums: rows.length, unnamed: unnamed, pages: pages, reason: reason, file: csvPath});
  this.banner('Tsum list: ' + rows.length + ' saved', 6000);
  return true;
}

/** The tsum art on card `slot`, for telling one page from the next. */
function tsumListCellRect(slot: number): MyTsumRect {
  const c = CollectionGrid.cells[slot];
  return {from: {x: c.x - 60, y: c.y - 70}, to: {x: c.x + 60, y: c.y + 50}};
}
