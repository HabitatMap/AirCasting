import { createSelector } from "reselect";

import { RootState } from "./";

const selectFixedSessionsState = (state: RootState) => state.fixedSessions;

export const selectFixedSessionsData = createSelector(
  [selectFixedSessionsState],
  (fixedSessionsState) =>
    fixedSessionsState.sessions.map((session) => ({
      id: session.id,
      lastMeasurementValue: session.lastMeasurementValue,
      latitude: session.latitude,
      longitude: session.longitude,
      streamId: session.streams[Object.keys(session.streams)[0]].id,
    }))
);
