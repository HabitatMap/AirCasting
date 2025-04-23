import { createSelector } from "reselect";
import { StatusEnum } from "../types/api";
import { IndoorSession, SessionList } from "../types/sessionType";
import { RootState } from "./";

const selectIndoorSessionsState = (state: RootState) => state.indoorSessions;

const selectIndoorSessionsStatusFulfilled = (state: RootState) =>
  state.indoorSessions.status === StatusEnum.Fulfilled;

const selectIndoorSessionsPoints = (isDormant: boolean) =>
  createSelector(
    [selectIndoorSessionsState],
    (indoorSessionsState): IndoorSession[] => {
      const sessions = isDormant
        ? indoorSessionsState.dormantIndoorSessions
        : indoorSessionsState.activeIndoorSessions;

      return sessions.map(
        ({
          id,
          lastMeasurementValue,
          title,
          startTimeLocal,
          endTimeLocal,
          streams,
          lastHourlyAverageValue,
        }) => {
          const firstStream = streams[Object.keys(streams)[0]];

          return {
            id,
            title,
            sensorName: firstStream.sensorName,
            startTime: startTimeLocal,
            endTime: endTimeLocal,
            averageValue: lastHourlyAverageValue || lastMeasurementValue,
            lastMeasurementValue,
          };
        }
      );
    }
  );

const selectIndoorSessionsList = (isDormant: boolean) =>
  createSelector(
    [
      // Add a more specific selector to get just the sessions array
      (state: RootState) =>
        isDormant
          ? state.indoorSessions.dormantIndoorSessions
          : state.indoorSessions.activeIndoorSessions,
    ],
    (sessions): SessionList[] => {
      // Now this will only re-run if the sessions array reference changes
      return sessions.map(
        ({
          id,
          title,
          startTimeLocal,
          endTimeLocal,
          streams,
          lastHourlyAverageValue,
          lastMeasurementValue,
        }) => {
          const firstStream = streams[Object.keys(streams)[0]];

          return {
            id,
            title,
            sensorName: firstStream.sensorName,
            averageValue: lastHourlyAverageValue || lastMeasurementValue,
            startTime: startTimeLocal,
            endTime: endTimeLocal,
            streamId: firstStream.id,
          };
        }
      );
    }
  );

export {
  selectIndoorSessionsList,
  selectIndoorSessionsPoints,
  selectIndoorSessionsState,
  selectIndoorSessionsStatusFulfilled,
};
