import { createSelector } from "reselect";

import { Session, SessionList } from "../types/sessionType";
import { RootState } from "./";
import { Session as MobileSession } from "./mobileSessionsSlice";

const selectMobileSessionsState = (state: RootState) => state.mobileSessions;

const selectMobileSessionPointsBySessionId = (sessionId: number) =>
  createSelector(
    [selectMobileSessionsState],
    (mobileSessionState): Session[] => {
      const mobileSessionByStreamId: MobileSession | undefined =
        mobileSessionState.sessions.find(
          (session) => Number(session.id) === Number(sessionId)
        );

      const stream =
        mobileSessionByStreamId?.streams[
          Object.keys(mobileSessionByStreamId?.streams)[0]
        ];

      return [
        {
          id: mobileSessionByStreamId?.id || 0,
          lastMeasurementValue: stream?.averageValue || 0,
          point: {
            lat: stream?.startLatitude || 0,
            lng: stream?.startLongitude || 0,
            maxLatitude: stream?.maxLatitude,
            maxLongitude: stream?.maxLongitude,
            minLatitude: stream?.minLatitude,
            minLongitude: stream?.minLongitude,
            streamId: stream?.id.toString() || "0",
          },
        },
      ];
    }
  );

const selectMobileSessionsPoints = createSelector(
  [selectMobileSessionsState],
  (mobileSessionsState): Session[] =>
    mobileSessionsState.sessions.map(({ id, streams }) => {
      const firstStream = streams[Object.keys(streams)[0]];

      return {
        id,
        lastMeasurementValue: firstStream.averageValue,
        point: {
          lat: firstStream.startLatitude,
          lng: firstStream.startLongitude,
          maxLatitude: firstStream.maxLatitude,
          maxLongitude: firstStream.maxLongitude,
          minLatitude: firstStream.minLatitude,
          minLongitude: firstStream.minLongitude,
          streamId: firstStream.id.toString(),
        },
      };
    })
);

const selectMobileSessionsList = createSelector(
  [selectMobileSessionsState],
  (mobileSessionsState): SessionList[] =>
    mobileSessionsState.sessions.map(
      ({ id, title, startTimeLocal, endTimeLocal, streams }) => {
        const firstStream = streams[Object.keys(streams)[0]];

        return {
          id,
          title,
          sensorName: firstStream.sensorName,
          averageValue: firstStream.averageValue,
          startTime: startTimeLocal,
          endTime: endTimeLocal,
          streamId: firstStream.id,
        };
      }
    )
);

export {
  selectMobileSessionPointsBySessionId,
  selectMobileSessionsList,
  selectMobileSessionsPoints,
  selectMobileSessionsState,
};
