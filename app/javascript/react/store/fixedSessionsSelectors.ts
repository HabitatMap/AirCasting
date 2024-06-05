import { createSelector } from "reselect";

import { Session } from "../components/Map/Markers/SessionType";
import { RootState } from "./";

const selectFixedSessionsState = (state: RootState) => state.fixedSessions;

export const selectFixedSessionsData = createSelector(
  [selectFixedSessionsState],
  (fixedSessionsState): Session[] =>
    fixedSessionsState.sessions.map(
      ({ id, lastMeasurementValue, latitude, longitude, streams }) => ({
        id,
        lastMeasurementValue,
        point: {
          lat: latitude,
          lng: longitude,
          streamId: streams[Object.keys(streams)[0]].id.toString(),
        },
      })
    )
);
