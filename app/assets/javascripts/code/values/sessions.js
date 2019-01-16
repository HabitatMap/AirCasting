export const formatSessionForList = session => ({
  title: session.title || 'unnamed',
  username: session.is_indoor ? 'anonymous' : session.username,
  $selected: session.$selected,
  id: session.id,
  timeframe: session.timeframe,
  shortTypes: session.shortTypes
});
