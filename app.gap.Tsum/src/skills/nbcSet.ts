// Nightmare Before Christmas (Set).
//
// Each activation fires one of three character skills at random -- Jack, Zero
// or Oogie Boogie -- each opening on its own cut-in.
//
// One of them adds tsums to the board and shrinks every tsum to fit, more with
// each activation -- from 25px apart to ~19 in the play square by the end of a
// round. At normal size the circle pass then finds about half of them, off
// centre, and the link reach spans hops the game refuses, so no chain lands.
// `scalesBoard` has each scan read the size and scale the board read to it
// (`updateBoardScale`, `Config.boardScale`).
//
// `colorBlur` 15: at the default 22 Sally's blue face and red hood average to
// a pale colour that clusters with Jack and Zero, so white chains ran through
// her and the game refused them. 15 keeps her apart (offline: 12% of
// clustered tsums in the wrong group down to 1%).
//
// Oogie Boogie rolls two dice: a total of 7 or more adds tsums, under 7 removes
// some. Any touch while they roll throws them again, once -- and the play loop
// chaining straight on used to spend that reroll on every roll, good or bad. So
// nothing touches the board until the roll is known: his green cut-in says the
// activation is his (`nbcCutIn`), the dice are read where they come to rest
// (`nbcReadDice`), and only a first roll under 7 gets the reroll tap.
//
// Not `bareTapActivates`: a blind tap from the play loop skips `afterActivate`,
// and with it the hold.

// --- Tuning data -----------------------------------------------------------

// Measured off the 2026-10-01 NBC recordings. Positions and sizes are in a
// 540px-wide capture of the play square.
var NbcDice = {
  // The cut-in is one blob most of the board wide, so a small capture does.
  cutInScan: 270,
  // Looked for this long after the tap; nothing seen means not Oogie.
  cutInWaitMs: 2000,
  pollMs: 40,
  // Largest blob as a share of the capture. Oogie's green face is ~0.10 (a
  // board's green tsums stay under 0.013); Jack's and Zero's white faces are
  // ~0.05, a board's white under 0.013. White is checked first: Zero's rainbow
  // reaches 0.056 green.
  greenMin: 0.06,
  whiteMin: 0.034,
  scan: 540,
  // A die's lit top face: one bright-red blob of at least this contour area.
  faceMinArea: 1500,
  // Where each top face (bounding box top-left) comes to rest, left die first.
  // Every throw lands there; a die anywhere else is still rolling.
  rest: [{x: 124, y: 246}, {x: 294, y: 166}],
  restTolerance: 14,
  // Identical reads in a row before a landing counts. A tumble passes through
  // sharp, readable poses, but never twice in the same place.
  stableReads: 2,
  // Pip blob: area against the face's bounding box, and how much of its own box
  // it fills. The skull engraved on every face is a sparse blob; a pip on a
  // shaded side face is taller than wide.
  pipMinRel: 0.012,
  pipMaxRel: 0.06,
  pipMinFill: 0.55,
  // A top-face pip has lit face red this far to its left and right, and above or
  // below it (the corner pips sit on the face's edge on one side).
  ringPad: 4,
  // From the cut-in to a landing (the dice tumble ~1s), and from the reroll tap
  // to the dice leaving their rest.
  landWaitMs: 4000,
  rethrowWaitMs: 800,
  // Held after the roll until the dice are gone, so no touch lands while they
  // still count.
  clearWaitMs: 3000,
  rerollBelow: 7,
};

interface NbcRange { lo: Color; hi: Color }

var NbcFaceRed: NbcRange = {lo: {r: 140, g: 0, b: 0}, hi: {r: 255, g: 60, b: 90}};
var NbcPip: NbcRange = {lo: {r: 18, g: 0, b: 0}, hi: {r: 125, g: 16, b: 16}};
var NbcGreen: NbcRange = {lo: {r: 0, g: 180, b: 0}, hi: {r: 170, g: 255, b: 150}};
var NbcWhite: NbcRange = {lo: {r: 225, g: 225, b: 225}, hi: {r: 255, g: 255, b: 255}};

// --- Reading ---------------------------------------------------------------

/** The play square, captured `width` px square; null if the capture failed. */
function nbcCapture(ts: Tsum, width: number): NativeImage | null {
  const img = getScreenshotModify(ts.playOffsetX, ts.playOffsetY, ts.playWidth, ts.playHeight,
    width, width, 100);
  return (img as unknown as number) ? img : null;
}

/** inRange with RGB bounds (the native takes BGRA). */
function nbcMask(img: NativeImage, range: NbcRange): NativeImage | null {
  const m = inRange(img, range.lo.b, range.lo.g, range.lo.r, 0,
    range.hi.b, range.hi.g, range.hi.r, 255);
  return (m as unknown as number) ? m : null;
}

/** Area of the largest blob in `range`. */
function nbcLargestBlob(img: NativeImage, range: NbcRange): number {
  const mask = nbcMask(img, range);
  if (!mask) { return 0; }
  try {
    const boxes = findContours(mask, 50, 0);
    let best = 0;
    for (let i = 0; i < boxes.length; i++) { best = Math.max(best, boxes[i].area); }
    return best;
  } finally {
    releaseImage(mask);
  }
}

/** Whose cut-in this activation opened on: Oogie's, someone else's, or none seen. */
function nbcCutIn(ts: Tsum): 'oogie' | 'other' | 'none' {
  const cfg = NbcDice;
  const from = Date.now();
  const px = cfg.cutInScan * cfg.cutInScan;
  while (ts.isRunning && Date.now() - from < cfg.cutInWaitMs) {
    const img = nbcCapture(ts, cfg.cutInScan);
    if (img) {
      let green = 0;
      let white = 0;
      try {
        white = nbcLargestBlob(img, NbcWhite) / px;
        green = nbcLargestBlob(img, NbcGreen) / px;
      } finally {
        releaseImage(img);
      }
      const kind = white >= cfg.whiteMin ? 'other' : green >= cfg.greenMin ? 'oogie' : null;
      if (kind) {
        logInfo(Log.Skill.NbcCutIn, { kind: kind, ms: Date.now() - from,
          green: +green.toFixed(3), white: +white.toFixed(3) });
        return kind;
      }
    }
    ts.sleep(cfg.pollMs);
  }
  logInfo(Log.Skill.NbcCutIn, { kind: 'none', ms: Date.now() - from });
  return 'none';
}

function nbcIsFaceRed(c: Color): boolean {
  return c.r >= NbcFaceRed.lo.r && c.g <= NbcFaceRed.hi.g && c.b <= NbcFaceRed.hi.b;
}

/** Pips on one die's top face: dark holes in its lit red, side-face pips left out. */
function nbcCountPips(img: NativeImage, face: ContourBox): number {
  const cfg = NbcDice;
  // A few px above the face, for the back corner's pip on its top edge.
  const y0 = Math.max(0, face.y - 6);
  const crop = cropImage(img, face.x, y0, face.width, face.y + face.height - y0);
  let mask: NativeImage | null = null;
  try {
    mask = nbcMask(crop, NbcPip);
    if (!mask) { return 0; }
    const blobs = findContours(mask, 1, 0);
    const box = face.width * face.height;
    const pips: ContourBox[] = [];
    for (let i = 0; i < blobs.length; i++) {
      const b = blobs[i];
      const rel = b.area / box;
      if (rel < cfg.pipMinRel || rel > cfg.pipMaxRel) { continue; }
      if (b.area / (b.width * b.height) < cfg.pipMinFill) { continue; }
      if (b.height > b.width * 1.05) { continue; }
      pips.push(b);
    }
    if (pips.length === 0) { return 0; }
    // Three samples on each side of each pip: left, right, above, below.
    const pts: Point[] = [];
    for (let i = 0; i < pips.length; i++) {
      const b = pips[i];
      const cx = face.x + b.x + Math.floor(b.width / 2);
      const cy = y0 + b.y + Math.floor(b.height / 2);
      const dx = Math.floor(b.width / 2) + cfg.ringPad;
      const dy = Math.floor(b.height / 2) + cfg.ringPad;
      for (let d = -2; d <= 2; d += 2) { pts.push({x: cx - dx, y: cy + d}); }
      for (let d = -2; d <= 2; d += 2) { pts.push({x: cx + dx, y: cy + d}); }
      for (let d = -2; d <= 2; d += 2) { pts.push({x: cx + d, y: cy - dy}); }
      for (let d = -2; d <= 2; d += 2) { pts.push({x: cx + d, y: cy + dy}); }
    }
    const c = getImageColors(img, pts);
    const side = (i: number, s: number) => {
      const k = i * 12 + s * 3;
      return nbcIsFaceRed(c[k]) || nbcIsFaceRed(c[k + 1]) || nbcIsFaceRed(c[k + 2]);
    };
    let n = 0;
    for (let i = 0; i < pips.length; i++) {
      if (side(i, 0) && side(i, 1) && (side(i, 2) || side(i, 3))) { n++; }
    }
    return n;
  } finally {
    if (mask) { releaseImage(mask); }
    releaseImage(crop);
  }
}

/** Both dice's top-face pips, left die first, or null unless both sit at rest. */
function nbcReadDice(ts: Tsum): number[] | null {
  const cfg = NbcDice;
  const img = nbcCapture(ts, cfg.scan);
  if (!img) { return null; }
  try {
    const mask = nbcMask(img, NbcFaceRed);
    if (!mask) { return null; }
    let faces: ContourBox[];
    try {
      faces = findContours(mask, cfg.faceMinArea, 0);
    } finally {
      releaseImage(mask);
    }
    const pips: number[] = [];
    for (let d = 0; d < cfg.rest.length; d++) {
      const rest = cfg.rest[d];
      let face: ContourBox | null = null;
      for (let i = 0; i < faces.length; i++) {
        if (Math.abs(faces[i].x - rest.x) <= cfg.restTolerance
            && Math.abs(faces[i].y - rest.y) <= cfg.restTolerance) {
          face = faces[i];
        }
      }
      if (!face) { return null; }
      const n = nbcCountPips(img, face);
      if (n < 1 || n > 6) { return null; }
      pips.push(n);
    }
    return pips;
  } finally {
    releaseImage(img);
  }
}

// --- The roll --------------------------------------------------------------

/** Polls `done` for up to `ms`; whether it came true. */
function nbcWaitFor(ts: Tsum, ms: number, done: () => boolean): boolean {
  const until = Date.now() + ms;
  while (ts.isRunning && Date.now() < until) {
    if (done()) { return true; }
    ts.sleep(NbcDice.pollMs);
  }
  return false;
}

/**
 * Oogie's roll, from his cut-in to the dice leaving: read the landing, reroll a
 * first roll under 7 with one tap mid-board, and hold every touch until the dice
 * are gone. The caller's fan tap and settle follow.
 */
function nbcPlayDice(ts: Tsum) {
  const cfg = NbcDice;
  let rerolled = false;
  let last: number[] | null = null;
  let same = 0;
  let deadline = Date.now() + cfg.landWaitMs;
  while (ts.isRunning && Date.now() < deadline) {
    const read = nbcReadDice(ts);
    same = !read ? 0 : last && read[0] === last[0] && read[1] === last[1] ? same + 1 : 1;
    last = read;
    if (read && same >= cfg.stableReads) {
      const total = read[0] + read[1];
      const reroll = !rerolled && total < cfg.rerollBelow;
      logInfo(Log.Skill.NbcDice, { roll: rerolled ? 2 : 1, dice: read, total: total, reroll: reroll });
      if (!reroll) {
        // Gone twice running, so one dropped read is not the end.
        let gone = 0;
        nbcWaitFor(ts, cfg.clearWaitMs, () => {
          gone = nbcReadDice(ts) ? 0 : gone + 1;
          return gone >= 2;
        });
        return;
      }
      ts.tap({x: 540, y: PlayAreaTopY + 540});  // middle of the board
      rerolled = true;
      nbcWaitFor(ts, cfg.rethrowWaitMs, () => nbcReadDice(ts) === null);
      last = null;
      same = 0;
      deadline = Date.now() + cfg.landWaitMs;
      continue;
    }
    ts.sleep(cfg.pollMs);
  }
  logWarn(Log.Skill.NbcDiceUnread, { roll: rerolled ? 2 : 1, last: last });
}

registerSkill({
  types: [SkillType.NightmareSet],
  scalesBoard: true,
  colorBlur: 15,
  afterActivate: function(ts) {
    if (nbcCutIn(ts) === 'oogie') {
      nbcPlayDice(ts);
    }
    skillRandomizeAndWait(ts);
  }
});
