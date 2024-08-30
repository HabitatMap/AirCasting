import { createSelector } from "reselect";

import { StatusEnum } from "../types/api";
import { Session, SessionList } from "../types/sessionType";
import { RootState } from "./";
import { FixedSession } from "./fixedSessionsSlice";
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

const transformSessionData = (sessions: FixedSession[]) => {
  return sessions.map(
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
};

const selectSessionsByType = (type: FixedSessionsTypes) =>
  createSelector(
    [selectActiveFixedSessionsState, selectDormantFixedSessionsState],
    (activeSessions, dormantSessions) => {
      return type === FixedSessionsTypes.ACTIVE
        ? activeSessions
        : dormantSessions;
    }
  );

const selectFixedSessionsPoints = (type: FixedSessionsTypes) =>
  createSelector(
    [selectSessionsByType(type)],
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

    // sessions.sessions.map(
    //   ({
    //     id,
    //     lastMeasurementValue,
    //     title,
    //     startTimeLocal,
    //     endTimeLocal,
    //     latitude,
    //     longitude,
    //     streams,
    //   }) => {
    //     const firstStream = streams[Object.keys(streams)[0]];

    //     return {
    //       id,
    //       title: title,
    //       sensorName: firstStream.sensorName,
    //       startTime: startTimeLocal,
    //       endTime: endTimeLocal,
    //       lastMeasurementValue,
    //       point: {
    //         lat: latitude,
    //         lng: longitude,
    //         streamId: firstStream.id.toString(),
    //       },
    //     };
    //   }
    // )
  );

const selectFixedSessionsList = (type: FixedSessionsTypes) =>
  createSelector([selectSessionsByType(type)], (sessions): SessionList[] => {
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
  });

const selectFixedSessionPointsBySessionId = (
  type: FixedSessionsTypes,
  sessionId: number | null
) =>
  createSelector([selectSessionsByType(type)], (sessions): Session[] => {
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
  });

// const selectActiveFixedSessionPointsBySessionId = (sessionId: number | null) =>
//   createSelector(
//     [selectActiveFixedSessionsState],
//     (activeFixedSessionsState): Session[] => {
//       const fixedSessionByStreamId = activeFixedSessionsState.sessions.find(
//         (session) => Number(session.id) === Number(sessionId)
//       );
//       const streams = fixedSessionByStreamId?.streams || {};
//       const firstStream = streams[Object.keys(streams)[0]];

//       return [
//         {
//           id: fixedSessionByStreamId?.id || 0,
//           lastMeasurementValue:
//             fixedSessionByStreamId?.lastMeasurementValue || 0,
//           point: {
//             lat: fixedSessionByStreamId?.latitude || 0,
//             lng: fixedSessionByStreamId?.longitude || 0,
//             streamId: firstStream?.id.toString() || "0",
//           },
//         },
//       ];
//     }
//   );

// const selectDormantFixedSessionsState = (state: RootState) =>
//   state.dormantFixedSessions;
// const selectDormantFixedSessionsStatusFulfilled = (state: RootState) =>
//   state.dormantFixedSessions.status === StatusEnum.Fulfilled;

// const selectDormantFixedSessionsPoints = createSelector(
//   [selectDormantFixedSessionsState],
//   (dormantFixedSessionsState): Session[] =>
//     dormantFixedSessionsState.sessions.map(
//       ({
//         id,
//         lastMeasurementValue,
//         title,
//         startTimeLocal,
//         endTimeLocal,
//         latitude,
//         longitude,
//         streams,
//       }) => {
//         const firstStream = streams[Object.keys(streams)[0]];

//         return {
//           id,
//           title: title,
//           sensorName: firstStream.sensorName,
//           startTime: startTimeLocal,
//           endTime: endTimeLocal,
//           lastMeasurementValue,
//           point: {
//             lat: latitude,
//             lng: longitude,
//             streamId: firstStream.id.toString(),
//           },
//         };
//       }
//     )
// );

// const selectDormantFixedSessionsList = createSelector(
//   [selectDormantFixedSessionsState],
//   (dormantFixedSessionsState): SessionList[] =>
//     dormantFixedSessionsState.sessions.map(
//       ({ id, title, startTimeLocal, endTimeLocal, streams }) => {
//         const firstStream = streams[Object.keys(streams)[0]];

//         return {
//           id,
//           title,
//           sensorName: firstStream.sensorName,
//           averageValue: firstStream.streamDailyAverage,
//           startTime: startTimeLocal,
//           endTime: endTimeLocal,
//           streamId: firstStream.id,
//         };
//       }
//     )
// );

// const selectDormantFixedSessionPointsBySessionId = (sessionId: number | null) =>
//   createSelector(
//     [selectDormantFixedSessionsState],
//     (dormantFixedSessionsState): Session[] => {
//       const fixedSessionByStreamId = dormantFixedSessionsState.sessions.find(
//         (session) => Number(session.id) === Number(sessionId)
//       );
//       const streams = fixedSessionByStreamId?.streams || {};
//       const firstStream = streams[Object.keys(streams)[0]];

//       return [
//         {
//           id: fixedSessionByStreamId?.id || 0,
//           lastMeasurementValue:
//             fixedSessionByStreamId?.lastMeasurementValue || 0,
//           point: {
//             lat: fixedSessionByStreamId?.latitude || 0,
//             lng: fixedSessionByStreamId?.longitude || 0,
//             streamId: firstStream?.id.toString() || "0",
//           },
//         },
//       ];
//     }
//   );

export {
  // selectActiveFixedSessionPointsBySessionId,
  // selectActiveFixedSessionsList,
  selectActiveFixedSessionsState,
  // selectActiveFixedSessionsStatusFulfilled,
  // selectDormantFixedSessionPointsBySessionId,
  // selectDormantFixedSessionsList,
  // selectDormantFixedSessionsPoints,
  selectDormantFixedSessionsState,
  selectFixedSessionPointsBySessionId,
  selectFixedSessionsList,
  selectFixedSessionsPoints,
  selectFixedSessionsStatusFulfilled,
  selectIsActiveSessionsFetched,
  selectIsDormantSessionsFetched,
};
