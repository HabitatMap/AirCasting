export const formatSessionForList = session => ({
  ...session,
  // `markers` contains references to `window`
  // since this is used in a watch with deep equality
  // they need to be removed to avoid the following error
  // `Can't copy! Making copies of Window or Scope instances is not supported.`
  markers: [],
  title: session.title || 'unnamed',
  username: session.is_indoor ? 'anonymous' : session.username
});
