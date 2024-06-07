import { createSelector } from "@reduxjs/toolkit";

import { Session } from "../components/Map/Markers/SessionType";
import { MobileStream, MobileStreamShortInfo } from "../types/mobileStream";
import { RootState } from "./";
import { selectMobileSessionsState } from "./mobileSessionsSelectors";

const selectMobileStreamData = (state: RootState): MobileStream =>
  state.mobileStream.data;

const selectMobileStreamPoints = createSelector(
  [selectMobileStreamData],
  (mobileStreamState): Session[] =>
    mobileStreamState.measurements.map(
      ({ time: id, value: lastMeasurementValue, latitude, longitude }) => ({
        id,
        lastMeasurementValue,
        point: {
          lat: latitude,
          lng: longitude,
          streamId: mobileStreamState.streamId.toString(),
        },
      })
    )
);

const selectMobileStreamShortInfo = createSelector(
  [selectMobileStreamData, selectMobileSessionsState],
  (mobileStreamData, mobileSessionState): MobileStreamShortInfo => {
    const maxMeasurementValue = Math.max(
      ...mobileStreamData.measurements.map((m) => m.value)
    );
    const minMeasurementValue = Math.min(
      ...mobileStreamData.measurements.map((m) => m.value)
    );

    const mobileSession = mobileSessionState.sessions.find(
      (session) => session.id === mobileStreamData.id
    );
    const streamData =
      mobileSession?.streams[Object.keys(mobileSession.streams)[0]];

    return {
      averageValue: streamData?.averageValue || 0,
      endTime: new Date(mobileStreamData.endTime).toISOString(),
      high: streamData?.thresholdHigh || 0,
      low: streamData?.thresholdLow || 0,
      max: streamData?.thresholdVeryHigh || 0,
      maxMeasurementValue,
      middle: streamData?.thresholdMedium || 0,
      min: streamData?.thresholdVeryLow || 0,
      minMeasurementValue,
      profile: mobileStreamData.username,
      sensorName: mobileStreamData.sensorName,
      sessionId: mobileStreamData.id.toString(),
      startTime: new Date(mobileStreamData.startTime).toISOString(),
      title: mobileStreamData.title,
      unitSymbol: mobileStreamData.sensorUnit,
    };
  }
);

export {
  selectMobileStreamData,
  selectMobileStreamPoints,
  selectMobileStreamShortInfo,
};
