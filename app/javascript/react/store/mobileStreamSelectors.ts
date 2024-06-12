import { createSelector } from "@reduxjs/toolkit";

import { MobileStream, MobileStreamShortInfo } from "../types/mobileStream";
import { Session } from "../types/sessionType";
import { RootState } from "./";
import { selectMobileSessionsState } from "./mobileSessionsSelectors";
import { initialState as mobileStreamInitialState } from "./mobileStreamSlice";
import { initialState as thresholdsInitialState } from "./thresholdSlice";

const selectMobileStreamData = (state: RootState): MobileStream =>
  state.mobileStream.data;

const selectMobileStreamPoints = createSelector(
  [selectMobileStreamData],
  (mobileStreamState): Session[] =>
    mobileStreamState.measurements.map(
      ({ time, value, latitude, longitude }, index) => ({
        id: index,
        lastMeasurementValue: value,
        time,
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
    const sessionStreamData =
      mobileSession?.streams[Object.keys(mobileSession.streams)[0]];

    return {
      averageValue:
        sessionStreamData?.averageValue ||
        mobileStreamInitialState.data.averageValue,
      endTime: new Date(mobileStreamData.endTime).toString(),
      high: sessionStreamData?.thresholdHigh || thresholdsInitialState.high,
      low: sessionStreamData?.thresholdLow || thresholdsInitialState.low,
      max: sessionStreamData?.thresholdVeryHigh || thresholdsInitialState.max,
      maxMeasurementValue,
      middle:
        sessionStreamData?.thresholdMedium || thresholdsInitialState.middle,
      min: sessionStreamData?.thresholdVeryLow || thresholdsInitialState.min,
      minMeasurementValue,
      profile: mobileStreamData.username,
      sensorName: mobileStreamData.sensorName,
      sessionId: mobileStreamData.id.toString(),
      startTime: new Date(mobileStreamData.startTime).toString(),
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
