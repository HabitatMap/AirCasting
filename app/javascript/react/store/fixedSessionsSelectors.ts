import { createSelector } from "reselect";

import { Session, SessionList } from "../types/sessionType";
import { RootState } from "./";

const selectFixedSessionsState = (state: RootState) => state.fixedSessions;

const selectFixedSessionsPoints = createSelector(
  [selectFixedSessionsState],
  (fixedSessionsState): Session[] =>
    fixedSessionsState.sessions.map(
      ({
        id,
        lastMeasurementValue,
        title,
        startTimeLocal,
        endTimeLocal,
        latitude,
        longitude,
        streams,
      }) => ({
        id,
        title: title,
        sensorName: streams[Object.keys(streams)[0]].sensorName,
        startTime: startTimeLocal,
        endTime: endTimeLocal,
        lastMeasurementValue,
        point: {
          lat: latitude,
          lng: longitude,
          streamId: streams[Object.keys(streams)[0]].id.toString(),
        },
      })
    )
);

const selectFixedSessionsList = createSelector(
  [selectFixedSessionsState],
  (fixedSessionsState): SessionList[] =>
    fixedSessionsState.sessions.map(
      ({ id, title, startTimeLocal, endTimeLocal, streams }) => {
        const firstStream = streams[Object.keys(streams)[0]];

        return {
          id,
          title,
          sensorName: firstStream.sensorName,
          // Please change averageValue once backend will be ready
          averageValue: 100,
          startTime: startTimeLocal,
          endTime: endTimeLocal,
          streamId: streams[Object.keys(streams)[0]].id,
        };
      }
    )
);

export {
  selectFixedSessionsPoints,
  selectFixedSessionsList,
  selectFixedSessionsState,
};
