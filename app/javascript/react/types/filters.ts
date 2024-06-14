const SessionTypes = {
  FIXED: "fixed",
  MOBILE: "mobile",
};

type SessionType = typeof SessionTypes.FIXED | typeof SessionTypes.MOBILE;

export { SessionType, SessionTypes };
