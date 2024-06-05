import { createSelector } from "reselect";

import { RootState } from "./";

export const selectMobileSessionsState = (state: RootState) =>
  state.mobileSessions;

export const selectMobileSessionsData = createSelector(
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
      streamId: session.streams[Object.keys(session.streams)[0]].id, // stream id
    }))
);
