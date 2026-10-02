// Nightmare Before Christmas (Set).
//
// Activates like a burst. One of the set's skills adds tsums to the board and
// shrinks every tsum to fit, more with each activation -- from 25px apart to
// ~19 in the play square by the end of a round. At normal size the circle pass
// then finds about half of them, off centre, and the link reach spans hops the
// game refuses, so no chain lands. `scalesBoard` has each scan read the size
// and scale the board read to it (`updateBoardScale`, `Config.boardScale`).
//
// `colorBlur` 15: at the default 22 Sally's blue face and red hood average to
// a pale colour that clusters with Jack and Zero, so white chains ran through
// her and the game refused them. 15 keeps her apart (offline: 12% of
// clustered tsums in the wrong group down to 1%).

registerSkill({
  types: [SkillType.NightmareSet],
  bareTapActivates: true,
  scalesBoard: true,
  colorBlur: 15,
  afterActivate: function(ts) {
    skillRandomizeAndWait(ts);
  }
});
