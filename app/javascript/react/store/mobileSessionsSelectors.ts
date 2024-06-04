import { createSelector } from "reselect";

import { RootState } from "./";

export const selectMobileSessionsState = (state: RootState) =>
  state.mobileSessions;

export const selectSessionsData = createSelector(
  [selectMobileSessionsState],
  (mobileSessionsState) =>
    mobileSessionsState.sessions.map((session) => ({
      id: session.id,
      lastMeasurementValue:
        session.streams[Object.keys(session.streams)[0]].averageValue,
      latitude: session.streams[Object.keys(session.streams)[0]].startLatitude,
      longitude:
        session.streams[Object.keys(session.streams)[0]].startLongitude,
      //temporarly using the first stream id as key
      key: session.streams[Object.keys(session.streams)[0]].id,
    }))
);
