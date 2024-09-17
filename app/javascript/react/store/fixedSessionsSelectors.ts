// import { createSelector } from "reselect";
// import { StatusEnum } from "../types/api";
// import { Session, SessionList } from "../types/sessionType";
// import { RootState } from "./";
// import { FixedSession } from "./fixedSessionsSlice";
// import { FixedSessionsTypes } from "./sessionFiltersSlice";

// const selectActiveFixedSessionsState = (state: RootState) =>
//   state.fixedSessions.activeSessions;

// const selectDormantFixedSessionsState = (state: RootState) =>
//   state.fixedSessions.dormantSessions;

// const selectFixedSessionsStatusFulfilled = (state: RootState) =>
//   state.fixedSessions.status === StatusEnum.Fulfilled;

// const selectFixedSessionsState = (state: RootState) => state.fixedSessions;

// const selectIsActiveSessionsFetched = createSelector(
//   [selectFixedSessionsState],
//   (fixedSessionsState) => fixedSessionsState.isActiveSessionsFetched
// );

// const selectIsDormantSessionsFetched = createSelector(
//   [selectFixedSessionsState],
//   (fixedSessionsState) => fixedSessionsState.isDormantSessionsFetched
// );

// const transformSessionData = (sessions: FixedSession[]) =>
//   sessions.map(
//     ({
//       id,
//       title,
//       lastMeasurementValue,
//       startTimeLocal,
//       endTimeLocal,
//       latitude,
//       longitude,
//       streams,
//     }) => {
//       const firstStream = streams[Object.keys(streams)[0]] || {};
//       return {
//         id,
//         title,
//         sensorName: firstStream?.sensorName || "",
//         lastMeasurementValue,
//         startTime: startTimeLocal,
//         endTime: endTimeLocal,
//         averageValue: firstStream.streamDailyAverage || 0,
//         point: {
//           lat: latitude,
//           lng: longitude,
//           streamId: firstStream.id.toString() || "0",
//         },
//         streamId: firstStream.id || 0,
//       };
//     }
//   );

// const selectSessionsByType = createSelector(
//   [
//     selectActiveFixedSessionsState,
//     selectDormantFixedSessionsState,
//     (_: RootState, type: FixedSessionsTypes) => type,
//   ],
//   (activeSessions, dormantSessions, type) => {
//     return type === FixedSessionsTypes.ACTIVE
//       ? activeSessions
//       : dormantSessions;
//   }
// );

// const selectTransformedSessionsByType = createSelector(
//   [selectSessionsByType],
//   (sessions) => transformSessionData(sessions)
// );

// const selectFixedSessionsPoints = createSelector(
//   [selectTransformedSessionsByType],
//   (transformedSessions): Session[] => {
//     return transformedSessions.map(
//       ({
//         id,
//         title,
//         sensorName,
//         lastMeasurementValue,
//         startTime,
//         endTime,
//         point,
//       }) => ({
//         id,
//         title,
//         sensorName,
//         startTime,
//         endTime,
//         lastMeasurementValue,
//         point,
//       })
//     );
//   }
// );

// const selectFixedSessionsList = createSelector(
//   [selectTransformedSessionsByType],
//   (transformedSessions): SessionList[] => {
//     return transformedSessions.map(
//       ({
//         id,
//         title,
//         sensorName,
//         averageValue,
//         startTime,
//         endTime,
//         streamId,
//       }) => ({
//         id,
//         title,
//         sensorName,
//         averageValue,
//         startTime,
//         endTime,
//         streamId,
//       })
//     );
//   }
// );

// const selectFixedSessionPointsBySessionId = createSelector(
//   [
//     selectSessionsByType,
//     (_: RootState, __: FixedSessionsTypes, sessionId: number | null) =>
//       sessionId,
//   ],
//   (sessions, sessionId): Session[] => {
//     const transformedSessions = transformSessionData(sessions);
//     const session = transformedSessions.find(
//       (session) => Number(session.id) === Number(sessionId)
//     );

//     return session
//       ? [
//           {
//             id: session.id,
//             lastMeasurementValue: session.lastMeasurementValue,
//             point: session.point,
//           },
//         ]
//       : [];
//   }
// );

// export {
//   selectActiveFixedSessionsState,
//   selectDormantFixedSessionsState,
//   selectFixedSessionPointsBySessionId,
//   selectFixedSessionsList,
//   selectFixedSessionsPoints,
//   selectFixedSessionsStatusFulfilled,
//   selectIsActiveSessionsFetched,
//   selectIsDormantSessionsFetched,
// };
