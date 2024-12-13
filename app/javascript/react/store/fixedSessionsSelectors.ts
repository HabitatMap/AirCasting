import { createSelector } from "reselect";
import { StatusEnum } from "../types/api";
import { FixedSession, SessionList } from "../types/sessionType";
import { RootState } from "./";
import { FixedSessionGeneral } from "./fixedSessionsSlice";
import { FixedSessionsTypes } from "./sessionFiltersSlice";

const selectActiveFixedSessionsState = (state: RootState) =>
  state.fixedSessions.activeSessions;

const selectDormantFixedSessionsState = (state: RootState) =>
  state.fixedSessions.dormantSessions;

const selectFixedSessionsStatusFulfilled = (state: RootState) =>
  state.fixedSessions.status === StatusEnum.Fulfilled;

const selectFixedSessionsState = (state: RootState) => state.fixedSessions;

const selectIsActiveSessionsFetched = createSelector(
  [selectFixedSessionsState],
  (fixedSessionsState) => fixedSessionsState.isActiveSessionsFetched
);

const selectIsDormantSessionsFetched = createSelector(
  [selectFixedSessionsState],
  (fixedSessionsState) => fixedSessionsState.isDormantSessionsFetched
);

const transformSessionData = (sessions: FixedSessionGeneral[]) =>
  sessions.map(
    ({
      id,
      title,
      lastMeasurementValue,
      startTimeLocal,
      endTimeLocal,
      latitude,
      longitude,
      streams,
      lastHourlyAverageValue,
    }) => {
      const firstStream = streams[Object.keys(streams)[0]] || {};
      return {
        id,
        title,
        sensorName: firstStream?.sensorName || "",
        lastMeasurementValue,
        startTime: startTimeLocal,
        endTime: endTimeLocal,
        averageValue: lastHourlyAverageValue || lastMeasurementValue,
        point: {
          lat: latitude,
          lng: longitude,
          streamId: firstStream.id.toString() || "0",
        },
        streamId: firstStream.id || 0,
      };
    }
  );

const selectSessionsByType = createSelector(
  [
    selectActiveFixedSessionsState,
    selectDormantFixedSessionsState,
    (_: RootState, type: FixedSessionsTypes) => type,
  ],
  (activeSessions, dormantSessions, type) => {
    return type === FixedSessionsTypes.ACTIVE
      ? activeSessions
      : dormantSessions;
  }
);

const selectTransformedSessionsByType = createSelector(
  [selectSessionsByType],
  (sessions) => transformSessionData(sessions)
);

const selectFixedSessionsPoints = createSelector(
  [selectTransformedSessionsByType],
  (transformedSessions): FixedSession[] => {
    return transformedSessions.map(
      ({
        id,
        title,
        sensorName,
        lastMeasurementValue,
        averageValue,
        startTime,
        endTime,
        point,
      }) => ({
        id,
        title,
        sensorName,
        startTime,
        endTime,
        lastMeasurementValue,
        averageValue,
        point,
      })
    );
  }
);

const selectFixedSessionsList = createSelector(
  [selectTransformedSessionsByType],
  (transformedSessions): SessionList[] => {
    return transformedSessions.map(
      ({
        id,
        title,
        sensorName,
        averageValue,
        startTime,
        endTime,
        streamId,
      }) => ({
        id,
        title,
        sensorName,
        averageValue,
        startTime,
        endTime,
        streamId,
      })
    );
  }
);

export {
  selectActiveFixedSessionsState,
  selectDormantFixedSessionsState,
  selectFixedSessionsList,
  selectFixedSessionsPoints,
  selectFixedSessionsStatusFulfilled,
  selectIsActiveSessionsFetched,
  selectIsDormantSessionsFetched,
};
