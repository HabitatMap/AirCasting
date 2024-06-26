import { createSelector } from "reselect";

import { StatusEnum } from "../types/api";
import { Session, SessionList } from "../types/sessionType";
import { RootState } from "./";

const selectFixedSessionsState = (state: RootState) => state.fixedSessions;
const selectFixedSessionsStatusFulfilled = (state: RootState) =>
  state.fixedSessions.status === StatusEnum.Fulfilled;

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
        streams: {
          // TEMPORARY: Hardcoded sensor_name
          sensor_name: {
            id: id,
          },
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
          averageValue: firstStream.streamDailyAverage,
          startTime: startTimeLocal,
          endTime: endTimeLocal,
          streamId: streams[Object.keys(streams)[0]].id,
        };
      }
    )
);

const selectFixedSessionPointsBySessionId = (sessionId: number | null) =>
  createSelector([selectFixedSessionsState], (fixedSessionState): Session[] => {
    const fixedSessionByStreamId = fixedSessionState.sessions.find(
      (session) => Number(session.id) === Number(sessionId)
    );
    const streams = fixedSessionByStreamId?.streams || {};

    return [
      {
        id: fixedSessionByStreamId?.id || 0,
        lastMeasurementValue: fixedSessionByStreamId?.lastMeasurementValue || 0,
        point: {
          lat: fixedSessionByStreamId?.latitude || 0,
          lng: fixedSessionByStreamId?.longitude || 0,
          streamId: streams[Object.keys(streams)[0]]?.id.toString() || "0",
        },
      },
    ];
  });

export {
  selectFixedSessionsList,
  selectFixedSessionsPoints,
  selectFixedSessionPointsBySessionId,
  selectFixedSessionsState,
  selectFixedSessionsStatusFulfilled,
};
