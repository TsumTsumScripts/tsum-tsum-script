// The "Then" dropdown's entries for Stop after games, written once. Shared by
// the settings page and the Quick Bar, like `src/bubbleOptions.ts`, so the two
// lists cannot drift. Not in the game bundle: the engine only compares ids.

/**
 * One offered action. No `share` id: the row is `neverShared`. `short` is the
 * Quick Bar chip's name, where the full one does not fit.
 */
interface StopAfterOption {
    key: StopAfterAction;
    title: UiText;
    short: UiText;
}

/** Mildest first: the default keeps the run going. */
var StopAfterOptions: StopAfterOption[] = [
    {key: StopAfterAction.AutoPlayOff,
     title: UiText.StopAfterAutoPlayOff, short: UiText.StopAfterAutoPlayOffShort},
    {key: StopAfterAction.Pause,
     title: UiText.StopAfterPause, short: UiText.StopAfterPauseShort},
    {key: StopAfterAction.Stop,
     title: UiText.StopAfterStop, short: UiText.StopAfterStopShort}
];
