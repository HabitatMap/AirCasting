import { createSelector } from "@reduxjs/toolkit";

import { Session } from "../components/Map/Markers/SessionType";
import { MobileStream, MobileStreamShortInfo } from "../types/mobileStream";
import { RootState } from "./";

const selectMobileStreamData = (state: RootState): MobileStream => {
  return state.mobileStream.data;
};

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
  [selectMobileStreamData],
  (mobileStreamData): MobileStreamShortInfo => {
    const total = mobileStreamData.measurements.reduce(
      (sum, measurement) => sum + measurement.value,
      0
    );
    const average = Number(
      (total / mobileStreamData.measurements.length).toFixed(2)
    );

    const maxMeasurementValue = mobileStreamData.measurements.reduce(
      (max, measurement) => {
        return measurement.value > max ? measurement.value : max;
      },
      mobileStreamData.measurements[0]?.value
    );

    const minMeasurementValue = mobileStreamData.measurements.reduce(
      (min, measurement) => {
        return measurement.value < min ? measurement.value : min;
      },
      mobileStreamData.measurements[0]?.value
    );

    return {
      endTime: new Date(mobileStreamData.endTime).toISOString(),
      lastMeasurementValue: average,
      max: maxMeasurementValue,
      min: minMeasurementValue,
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
