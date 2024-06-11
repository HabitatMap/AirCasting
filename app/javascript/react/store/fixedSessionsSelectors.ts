import { createSelector } from "reselect";

import { Session } from "../types/sessionType";
import { RootState } from "./";

const selectFixedSessionsState = (state: RootState) => state.fixedSessions;

const selectFixedSessionsPoints = createSelector(
  [selectFixedSessionsState],
  (fixedSessionsState): Session[] =>
    fixedSessionsState.sessions.map(
      ({ id, lastMeasurementValue, title, latitude, longitude, streams }) => ({
        id,
        title: title,
        sensorName: streams[Object.keys(streams)[0]].sensorName,
        lastMeasurementValue,
        point: {
          lat: latitude,
          lng: longitude,
          streamId: streams[Object.keys(streams)[0]].id.toString(),
        },
      })
    )
);

export { selectFixedSessionsPoints, selectFixedSessionsState };
