export const formatSessionForList = session => ({
  title: session.title || 'unnamed',
  username: session.is_indoor ? 'anonymous' : session.username,
  $selected: session.$selected,
  // `$selected` should be enough but for whatever reasons if that's
  // the only thing that changes it does not trigger a `watch`
  selected: session.$selected,
  id: session.id,
  timeframe: session.timeframe,
  shortTypes: session.shortTypes
});
