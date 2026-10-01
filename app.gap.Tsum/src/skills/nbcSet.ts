// Nightmare Before Christmas (Set).
//
// Activates like a burst. One of the set's skills adds tsums to the board and
// shrinks every tsum to fit, more with each activation -- from 25px apart to
// ~19 in the play square by the end of a round. At normal size the circle pass
// then finds about half of them, off centre, and the link reach spans hops the
// game refuses, so no chain lands. `scalesBoard` has each scan read the size
// and scale the board read to it (`updateBoardScale`, `Config.boardScale`).

registerSkill({
  types: [SkillType.NightmareSet],
  bareTapActivates: true,
  scalesBoard: true,
  afterActivate: function(ts) {
    skillRandomizeAndWait(ts);
  }
});
