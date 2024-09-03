import { createSelector } from "reselect";
import { StatusEnum } from "../types/api";
import { IndoorSession, SessionList } from "../types/sessionType";
import { RootState } from "./";

const selectIndoorSessionsState = (state: RootState) => state.indoorSessions;

const selectIndoorSessionsStatusFulfilled = (state: RootState) =>
  state.indoorSessions.status === StatusEnum.Fulfilled;

const selectIndoorSessionsPoints = createSelector(
  [selectIndoorSessionsState],
  (indoorSessionsState): IndoorSession[] =>
    indoorSessionsState.sessions.map(
      ({
        id,
        lastMeasurementValue,
        title,
        startTimeLocal,
        endTimeLocal,
        streams,
      }) => {
        const firstStream = streams[Object.keys(streams)[0]];

        return {
          id,
          title,
          sensorName: firstStream.sensorName,
          startTime: startTimeLocal,
          endTime: endTimeLocal,
          lastMeasurementValue,
        };
      }
    )
);

const selectIndoorSessionsList = (isDormant: boolean | null) =>
  createSelector(
    [selectIndoorSessionsState],
    (indoorSessionsState): SessionList[] => {
      return indoorSessionsState.sessions
        .filter((session) => session.isActive === !isDormant)
        .map(({ id, title, startTimeLocal, endTimeLocal, streams }) => {
          const firstStream = streams[Object.keys(streams)[0]];

          return {
            id,
            title,
            sensorName: firstStream.sensorName,
            averageValue: firstStream.streamDailyAverage,
            startTime: startTimeLocal,
            endTime: endTimeLocal,
            streamId: firstStream.id,
          };
        });
    }
  );

export {
  selectIndoorSessionsList,
  selectIndoorSessionsPoints,
  selectIndoorSessionsState,
  selectIndoorSessionsStatusFulfilled,
};
