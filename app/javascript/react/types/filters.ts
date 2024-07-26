const SessionTypes = {
  FIXED: "fixed",
  MOBILE: "mobile",
};

type SessionType = typeof SessionTypes.FIXED | typeof SessionTypes.MOBILE;

type fetchTagsParamsType = {
  tag: string;
  west: string;
  east: string;
  south: string;
  north: string;
  timeFrom: string;
  timeTo: string;
  usernames: string | null;
  sensorName: string;
  unitSymbol: string;
  sessionType: string;
};

export { SessionType, SessionTypes, fetchTagsParamsType };
