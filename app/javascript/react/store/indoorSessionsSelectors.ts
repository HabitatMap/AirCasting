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
          averageValue,
        }) => {
          const firstStream = streams[Object.keys(streams)[0]];

          return {
            id,
            title,
            sensorName: firstStream.sensorName,
            startTime: startTimeLocal,
            endTime: endTimeLocal,
            averageValue: averageValue || null,
            lastMeasurementValue,
          };
        }
      );
    }
  );

const selectIndoorSessionsList = (isDormant: boolean) =>
  createSelector(
    [
      (state: RootState) =>
        isDormant
          ? state.indoorSessions.dormantIndoorSessions
          : state.indoorSessions.activeIndoorSessions,
    ],
    (sessions): SessionList[] => {
      return sessions.map(
        ({
          id,
          title,
          startTimeLocal,
          endTimeLocal,
          streams,
          averageValue,
        }) => {
          const firstStream = streams[Object.keys(streams)[0]];
          return {
            id,
            title,
            sensorName: firstStream.sensorName,
            averageValue: averageValue,
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
