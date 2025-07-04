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

          // For dormant indoor sessions, get average_value from streams
          // For active indoor sessions, use lastHourlyAverageValue or lastMeasurementValue
          let averageValue: number | null = null;

          if (
            firstStream &&
            ("average_value" in firstStream || "averageValue" in firstStream)
          ) {
            // Dormant sessions have average_value in streams (check both snake_case and camelCase)
            averageValue =
              (firstStream as any).average_value ??
              (firstStream as any).averageValue ??
              null;
          } else {
            // Active sessions use lastHourlyAverageValue or lastMeasurementValue
            averageValue =
              lastHourlyAverageValue ?? lastMeasurementValue ?? null;
          }

          return {
            id,
            title,
            sensorName: firstStream.sensorName,
            startTime: startTimeLocal,
            endTime: endTimeLocal,
            averageValue,
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
          lastHourlyAverageValue,
          lastMeasurementValue,
        }) => {
          const firstStream = streams[Object.keys(streams)[0]];

          // For dormant indoor sessions, get average_value from streams
          // For active indoor sessions, use lastHourlyAverageValue or lastMeasurementValue
          let averageValue: number | null = null;

          if (
            firstStream &&
            ("average_value" in firstStream || "averageValue" in firstStream)
          ) {
            // Dormant sessions have average_value in streams (check both snake_case and camelCase)
            averageValue =
              (firstStream as any).average_value ??
              (firstStream as any).averageValue ??
              null;
          } else {
            // Active sessions use lastHourlyAverageValue or lastMeasurementValue
            averageValue =
              lastHourlyAverageValue ?? lastMeasurementValue ?? null;
          }

          return {
            id,
            title,
            sensorName: firstStream.sensorName,
            averageValue,
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
