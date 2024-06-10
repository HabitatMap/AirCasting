import { createSelector } from "reselect";

import { Session } from "../components/Map/Markers/SessionType";
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

export {
  selectMobileSessionsPoints,
  selectMobileSessionPointsBySessionId,
  selectMobileSessionsState,
};
