// Select My Tsum: make a given tsum the MyTsum, for the workflow's Select Tsum
// node (src/workflow.ts).
//
// No scanning. The Tsum List only grows at the end of the Date acquired order,
// so a tsum's `order` in this device's list file (tsumListLoadFile) fixes its
// card: page floor((order-1)/8), slot (order-1)%8 of `CollectionGrid`.
//
//   already the MyTsum (ts.myTsum)            done, nothing navigated
//   collection, Date acquired, owned only,    the export's opening (tsumList.ts)
//   rewind, turn `page` pages                 tsumListTurnPage; or, when
//                                             nearer the end and the last card
//                                             is still the list's last tsum,
//                                             scrub to the last page, turn back
//   tap the card, wait for its portrait       tsumListSelectCard
//   ONE confirming read                       identifyCollectionTsum; another
//                                             tsum, or no confident read, means
//                                             the list is out of date:
//                                             terminate `tsum-list-stale`
//   tap MyTsum Set until the button greys     collectionShowsMyTsum, 3 taps
//   put the player's sort back                restoreCollectionSort
//
// Other failures answer `{fail}`, which the runner retries, then skips.

/** The 8-card collection page the export read. */
const SelectMyTsumPerPage = 8;
/** Taps on MyTsum Set before giving up. */
const SelectMyTsumSetAttempts = 3;

/** Makes `short` (the stats CSV's tsum key) the MyTsum. */
function selectMyTsum(short: string): GapWorkflowResult {
  const run = ts;
  if (run === undefined) {
    return { fail: 'no-run' };
  }
  // The runner's check already refused a missing file or tsum; this is a
  // file deleted or rewritten since the run began.
  const file = tsumListLoadFile();
  if (file === null) {
    return { terminate: 'tsum-list-missing' };
  }
  let row: TsumListFile['tsums'][number] | null = null;
  for (let i = 0; i < file.tsums.length && row === null; i++) {
    if (file.tsums[i].tsum === short) {
      row = file.tsums[i];
    }
  }
  if (row === null || row.order < 1) {
    return { terminate: 'tsum-not-in-list:' + short };
  }
  const page = Math.floor((row.order - 1) / SelectMyTsumPerPage);
  const slot = (row.order - 1) % SelectMyTsumPerPage;
  const fields = { tsum: short, order: row.order, page: page, slot: slot };

  if (run.myTsum === short) {
    logInfo(Log.Workflow.SelectTsumAlready, 'The Tsum is already the MyTsum', fields);
    return 'done';
  }
  logInfo(Log.Workflow.SelectTsumStart, 'Selecting the MyTsum', fields);

  gPages.navigate(PageName.TsumsPage);
  if (!run.awaitPage(PageName.TsumsPage, UnlockReturnWaitMs)) {
    return selectMyTsumFailed('no collection', fields);
  }
  const previous = run.sortCollection(CollectionSort.DateAcquired, true);
  if (previous === null) {
    return selectMyTsumFailed('sort failed', fields);
  }
  try {
    return selectMyTsumOnGrid(run, short, row.name, page, slot, file.tsums, fields);
  } finally {
    run.restoreCollectionSort(previous, CollectionSort.DateAcquired);
  }
}

/** The part on the sorted collection; the caller puts the sort back. */
function selectMyTsumOnGrid(run: Tsum, short: string, name: string, page: number, slot: number,
                            tsums: TsumListFile['tsums'], fields: LogFields): GapWorkflowResult {
  const reached = selectMyTsumGoToPage(run, page, tsums, fields);
  if (reached !== null) {
    return reached;
  }
  run.awaitCollectionLoaded();
  if (run.readCollectionCards()[slot] === 'empty') {
    return selectMyTsumStale(fields, { emptySlot: true });
  }
  if (!tsumListSelectCard(run, slot)) {
    return run.isRunning ? selectMyTsumFailed('card missed', fields) : 'wait';
  }
  // One read, to confirm; not a search.
  const id = run.identifyCollectionTsum();
  if (id === null || !id.confident || id.short !== short) {
    return selectMyTsumStale(fields, {
      read: id === null ? null : id.short,
      confident: id === null ? false : id.confident,
      score: id === null ? null : +id.score.toFixed(3),
    });
  }
  // Grey already: the card is the MyTsum even though the last round's read
  // did not say so.
  let set = run.collectionShowsMyTsum();
  for (let i = 0; i < SelectMyTsumSetAttempts && !set && run.isRunning; i++) {
    run.tap(CollectionGrid.setButton);
    run.settleScreen(UnlockOptionSettleMs);
    set = run.collectionShowsMyTsum();
  }
  if (!set) {
    return run.isRunning ? selectMyTsumFailed('set not taken', fields) : 'wait';
  }
  // The next round's pre-round read (identifyMyTsum) checks this again.
  run.myTsum = short;
  run.myTsumName = name !== '' ? name : id.full;
  logInfo(Log.Workflow.SelectTsumDone, 'MyTsum set', fields);
  return 'done';
}

/**
 * Brings the grid to `page`; null once there. From the last page (the
 * scrubber's right end) when that is fewer turns, but only if that page ends
 * on the list's last tsum. New tsums are appended, so any since the export
 * fail that check, and the walk from page 1 (unaffected by them) runs instead.
 */
function selectMyTsumGoToPage(run: Tsum, page: number, tsums: TsumListFile['tsums'],
                              fields: LogFields): GapWorkflowResult | null {
  const listed = tsums.length;
  const lastPage = Math.floor((listed - 1) / SelectMyTsumPerPage);
  const fromEnd = lastPage - page;
  if (fromEnd < page && run.skipCollectionToEnd() &&
      selectMyTsumEndMatches(run, tsums[listed - 1].tsum, (listed - 1) % SelectMyTsumPerPage)) {
    for (let p = 0; p < fromEnd; p++) {
      if (!run.isRunning) {
        return 'wait';
      }
      run.awaitCollectionLoaded();
      if (!tsumListTurnPage(run, true)) {
        return selectMyTsumFailed('page turn failed', fields);
      }
    }
    return null;
  }
  run.rewindCollection();
  for (let p = 0; p < page; p++) {
    if (!run.isRunning) {
      return 'wait';
    }
    run.awaitCollectionLoaded();
    // Fewer pages than the list says: the collection is not the one listed.
    if (run.collectionAtLastPage()) {
      return selectMyTsumStale(fields, { atPage: p });
    }
    if (!tsumListTurnPage(run)) {
      return selectMyTsumFailed('page turn failed', fields);
    }
  }
  return null;
}

/**
 * Does the last page end at `slot` with `short`? A card-count check first
 * (one capture), then one portrait read of that last card.
 */
function selectMyTsumEndMatches(run: Tsum, short: string, slot: number): boolean {
  const cards = run.readCollectionCards();
  for (let i = 0; i < cards.length; i++) {
    if ((cards[i] !== 'empty') !== (i <= slot)) {
      logDebug(Log.Workflow.SelectTsumEndChanged, { want: short, slot: slot, emptyAt: i });
      return false;
    }
  }
  if (!tsumListSelectCard(run, slot)) {
    return false;
  }
  const id = run.identifyCollectionTsum();
  if (id !== null && id.confident && id.short === short) {
    return true;
  }
  logDebug(Log.Workflow.SelectTsumEndChanged, { want: short, read: id === null ? null : id.short });
  return false;
}

/** Logs a failed step; the runner retries the node, then skips it. */
function selectMyTsumFailed(reason: string, fields: LogFields): GapWorkflowResult {
  logWarn(Log.Workflow.SelectTsumFailed, 'Could not select the MyTsum',
    Object.assign({ reason: reason }, fields));
  return { fail: reason.replace(/ /g, '-') };
}

/** The card is not where the list says: the list is out of date. */
function selectMyTsumStale(fields: LogFields, seen: LogFields): GapWorkflowResult {
  logWarn(Log.Workflow.SelectTsumStale, 'The Tsum List is out of date; run Export Tsum List again',
    Object.assign({}, fields, seen));
  return { terminate: 'tsum-list-stale' };
}

// --- Change My Tsum from GAP Companion ------------------------------------------
//
// The phone's Change My Tsum action (`gapRemoteAction`, src/companion.ts) may
// not tap, so it queues the same Select My Tsum as a one-shot task, run
// between rounds like the other "Now" chores.

/** Name of the one-shot task `selectMyTsumNow` queues. */
const SelectTsumNowTask = 'selectTsumNow';
/** Tries of a failed step before giving up (the workflow node's retry count). */
const SelectTsumNowAttempts = 3;

/** The tsum a queued change is waiting to select, or null. */
let gSelectTsumNowQueued: string | null = null;

/**
 * Queues `short` as the next MyTsum on the live run. Answers what the action
 * returns: 'queued', or why not ('no run', 'workflow run', 'walkthrough',
 * 'tsum list missing'). A second call before the first ran replaces its tsum.
 */
function selectMyTsumNow(short: string): string {
  if (!gRunActive || ts === undefined || gTaskController === undefined) {
    return 'no run';
  }
  // A workflow picks its own tsums; a walkthrough records the player's taps.
  if (gWorkflowRun) {
    return 'workflow run';
  }
  if (gWalkthroughRun) {
    return 'walkthrough';
  }
  if (tsumListLoadFile() === null) {
    return 'tsum list missing';
  }
  const replacing = gSelectTsumNowQueued !== null;
  gSelectTsumNowQueued = short;
  logInfo(Log.Workflow.SelectTsumNowQueued, 'Changing the MyTsum next', { tsum: short });
  ts.banner('Changing My Tsum next', 4000);
  if (replacing) {
    return 'queued';
  }
  const run = ts;
  const controller = gTaskController;
  let failures = 0;
  run.yieldAsked = true;
  controller.newTask(SelectTsumNowTask, function() {
    run.yieldAsked = false;
    const target = gSelectTsumNowQueued;
    if (target === null) {
      controller.removeTask(SelectTsumNowTask);
      return;
    }
    if (roundInProgress()) {
      run.yieldAsked = true;
      return;
    }
    const res = selectMyTsum(target);
    // Paused mid-way: try again on the next turn.
    if (res === 'wait') {
      run.yieldAsked = true;
      return;
    }
    if (typeof res === 'object' && 'fail' in res && ++failures < SelectTsumNowAttempts) {
      return;
    }
    gSelectTsumNowQueued = null;
    controller.removeTask(SelectTsumNowTask);
  }, UnlockNowRetryMs, 0, false, JobPriority.SelectTsumNow);
  return 'queued';
}
