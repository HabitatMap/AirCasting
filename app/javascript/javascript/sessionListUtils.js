import { formatSessionForList } from "./session";

export const sessionsInfoForElm = (sessions, count, sensorName) => ({
  fetched: sessions
    .map(formatSessionForList)
    .map(formatSessionForElm),
  fetchableSessionsCount: count,
});

const formatSessionForElm = (s) => ({
  ...s,
  shortTypes: s.shortTypes.map(({ name, type }) => ({ name, type_: type })),
  average: nullOrValue(s.average),
});

const nullOrValue = (value) => {
  if (value === undefined) {
    return null;
  } else {
    return value;
  }
};
