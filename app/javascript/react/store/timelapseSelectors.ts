// import { createSelector } from "@reduxjs/toolkit";
// import { RootState } from "./index";

// // Selector to get the timelapse state from the root state
// const selectTimelapseState = (state: RootState) => state.timelapse;

// export const selectTimelapseSessionsPoints = createSelector(
//   [selectTimelapseState],
//   (timelapseState) => {
//     const sessionsByTimestamp: { [timestamp: string]: any[] } = {};

//     Object.keys(timelapseState.data).forEach((timestamp) => {
//       const sessionsAtTimestamp = timelapseState.data[timestamp];

//       sessionsByTimestamp[timestamp] = sessionsAtTimestamp.map(
//         ({
//           id,
//           lastMeasurementValue,
//           title,
//           startTimeLocal,
//           endTimeLocal,
//           latitude,
//           longitude,
//           streams,
//         }) => {
//           const firstStream = streams[Object.keys(streams)[0]];

//           return {
//             id,
//             title: title,
//             sensorName: firstStream.sensorName,
//             startTime: startTimeLocal,
//             endTime: endTimeLocal,
//             lastMeasurementValue,
//             point: {
//               lat: latitude,
//               lng: longitude,
//               streamId: firstStream.id.toString(),
//             },
//             streams: {
//               sensor_name: {
//                 id: id,
//               },
//             },
//           };
//         }
//       );
//     });

//     return sessionsByTimestamp;
//   }
// );
