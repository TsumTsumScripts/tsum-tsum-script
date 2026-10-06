// Click Assist: the user picks the tsum, the script draws the chain.
//
// Instead of scanning and linking on its own cadence, the script sits on the
// touch event stream and reacts to where the user taps. Auto-play and Click
// Assist are mutually exclusive (see start()).

// The touchscreen the host found, logged once so a device that reports none is
// visible in the run log rather than silently never assisting.
Tsum.prototype.findTouchDevice = function() {
  if (this._touchDevice !== undefined) { return this._touchDevice; }

  const devices = touchDevices();
  const best = devices.length > 0 ? devices[0] : null;
  this._touchDevice = best;
  if (best) {
    logInfo(Log.Assist.TouchDevice, 'Click Assist found the touch input device',
      { device: best.path, xMax: best.xMax, yMax: best.yMax });
  } else {
    logError(Log.Assist.NoTouchDevice, 'Click Assist could not locate the touch input device');
  }
  return best;
};

// Waits up to `timeoutSec` for the user's next touch, in screen pixels, or null
// on timeout. The host owns the event stream and the scaling from the input
// device's own range -- the two differ on most devices.
//
// Any X/Y in the burst counts as a touch: BTN_TOUCH is not gated on, because
// protocol B devices and many emulators omit it, and the release position is
// still the position the user meant.
Tsum.prototype.pollTouchDown = function(timeoutSec) {
  if (!this.findTouchDevice()) { return null; }
  const touch = readTouch(timeoutSec * 1000);
  return touch === null ? null : { x: touch.x, y: touch.y };
};

// Stops auto-linking and waits for the user to tap a tsum. On each tap, finds
// the connected component containing the touched tsum's color and chains them.
// The user supplies the "where", the script supplies the draw.
Tsum.prototype.taskClickAssist = function() {
  logInfo(Log.Assist.GameStart, 'Click Assist: game start', { roundId: logBeginRound() });
  gPages.navigate(PageName.GamePlaying);
  logInfo(Log.Assist.Ready, 'Click Assist ready -- tap a tsum to connect its chain');
  this.runTimes = 0;
  this.myTsumColor = null;
  this.myTsumIdx = -1;

  const pageCheckEvery = 5;
  let sinceLastPageCheck = 0;
  let lastActTime = 0;

  while (this.isRunning) {
    const touch = this.pollTouchDown(1);
    if (touch === null) {
      sinceLastPageCheck++;
      if (sinceLastPageCheck >= pageCheckEvery) {
        sinceLastPageCheck = 0;
        let page = gPages.detect(1, 1500);
        if (page !== PageName.GamePlaying && page !== PageName.GamePause) {
          this.sleep(500);
          page = gPages.detect(1, 1500);
          if (page !== PageName.GamePlaying && page !== PageName.GamePause) {
            logInfo(Log.Play.GameOver);
            break;
          }
        }
      }
      continue;
    }
    sinceLastPageCheck = 0;

    // Debounce: ignore taps that arrive too soon after we just drew a chain --
    // those are most likely the trailing events of our own synthetic input.
    const now = Date.now();
    if (now - lastActTime < 600) { continue; }

    // Only react to taps inside the play area; taps on UI chrome (skill button,
    // pause, etc.) should be ignored.
    const inPlay = touch.x >= this.playOffsetX
              && touch.x < this.playOffsetX + this.playWidth
              && touch.y >= this.playOffsetY
              && touch.y < this.playOffsetY + this.playHeight;
    if (!inPlay) {
      logDebug(Log.Assist.TapOutside, { x: touch.x, y: touch.y });
      continue;
    }

    // Map screen-pixel tap to the playResize coordinate space the board uses.
    const boardX = (touch.x - this.playOffsetX) * this.playResizeWidth / this.playWidth - Config.tsumWidth / 2;
    const boardY = (touch.y - this.playOffsetY) * this.playResizeHeight / this.playHeight - Config.tsumWidth / 2;

    // Brief pause so the user's finger lifts before we start our own input.
    this.sleep(120);

    const board = this.scanBoardQuick();
    if (board == null) { break; }

    const chain = findChainAtTouch(board, boardX, boardY);
    if (chain && chain.length >= 3) {
      logInfo(Log.Assist.Linking, 'Click Assist linking a chain', { chainLength: chain.length });
      this.linkTsums(chain);
      lastActTime = Date.now();
      this.sleep(400);
    } else {
      logDebug(Log.Assist.NoChain, { boardX: +boardX.toFixed(1), boardY: +boardY.toFixed(1) });
    }
    this.runTimes++;
  }
};
