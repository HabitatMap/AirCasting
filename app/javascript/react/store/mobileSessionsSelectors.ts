import { RootState } from ".";

import { createSelector } from "reselect";

const selectMobileSessionsState = (state: RootState) => state.mobileSessions;

export const selectSessionsData = createSelector(
  [selectMobileSessionsState],
  (mobileSessionsState) =>
    mobileSessionsState.sessions.map((session) => ({
      id: session.id,
      lastMeasurementValue: session.lastMeasurementValue,
      latitude: session.latitude,
      longitude: session.longitude,
      //temporarly using the first stream id as key
      key: session.streams[Object.keys(session.streams)[0]].id,
    }))
);
