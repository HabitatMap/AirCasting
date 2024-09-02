import { createSelector } from "reselect";
import { StatusEnum } from "../types/api";
import { Session, SessionList } from "../types/sessionType";
import { RootState } from "./";
import { FixedSession } from "./fixedSessionsSlice";
import { FixedSessionsTypes } from "./sessionFiltersSlice";

// Base selectors to get active and dormant fixed sessions
const selectActiveFixedSessionsState = (state: RootState) =>
  state.fixedSessions.activeSessions;

const selectDormantFixedSessionsState = (state: RootState) =>
  state.fixedSessions.dormantSessions;

// Selector to check if fixed sessions status is fulfilled
const selectFixedSessionsStatusFulfilled = (state: RootState) =>
  state.fixedSessions.status === StatusEnum.Fulfilled;

// Base selector to get the entire fixed sessions state
const selectFixedSessionsState = (state: RootState) => state.fixedSessions;

// Selector to check if active sessions have been fetched
const selectIsActiveSessionsFetched = createSelector(
  [selectFixedSessionsState],
  (fixedSessionsState) => fixedSessionsState.isActiveSessionsFetched
);

// Selector to check if dormant sessions have been fetched
const selectIsDormantSessionsFetched = createSelector(
  [selectFixedSessionsState],
  (fixedSessionsState) => fixedSessionsState.isDormantSessionsFetched
);

// Helper function to transform session data
const transformSessionData = (sessions: FixedSession[]) =>
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
    }) => {
      const firstStream = streams[Object.keys(streams)[0]];
      return {
        id,
        title,
        sensorName: firstStream.sensorName,
        lastMeasurementValue,
        startTime: startTimeLocal,
        endTime: endTimeLocal,
        averageValue: firstStream.streamDailyAverage,
        point: {
          lat: latitude,
          lng: longitude,
          streamId: firstStream.id.toString(),
        },
        streamId: firstStream.id,
      };
    }
  );

// Selector factory to create a memoized selector for sessions by type
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

// Selector to get fixed sessions points by type
const selectFixedSessionsPoints = createSelector(
  [selectSessionsByType],
  (sessions): Session[] => {
    const transformedSessions = transformSessionData(sessions);
    return transformedSessions.map(
      ({
        id,
        title,
        sensorName,
        lastMeasurementValue,
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
        point,
      })
    );
  }
);

// Selector to get the fixed sessions list by type
const selectFixedSessionsList = createSelector(
  [selectSessionsByType],
  (sessions): SessionList[] => {
    const transformedSessions = transformSessionData(sessions);
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

// Selector to get fixed session points by session ID and type
const selectFixedSessionPointsBySessionId = createSelector(
  [
    selectSessionsByType,
    (_: RootState, __: FixedSessionsTypes, sessionId: number | null) =>
      sessionId,
  ],
  (sessions, sessionId): Session[] => {
    const transformedSessions = transformSessionData(sessions);
    const session = transformedSessions.find(
      (session) => Number(session.id) === Number(sessionId)
    );

    return session
      ? [
          {
            id: session.id,
            lastMeasurementValue: session.lastMeasurementValue,
            point: session.point,
          },
        ]
      : [];
  }
);

export {
  selectActiveFixedSessionsState,
  selectDormantFixedSessionsState,
  selectFixedSessionPointsBySessionId,
  selectFixedSessionsList,
  selectFixedSessionsPoints,
  selectFixedSessionsStatusFulfilled,
  selectIsActiveSessionsFetched,
  selectIsDormantSessionsFetched,
};
