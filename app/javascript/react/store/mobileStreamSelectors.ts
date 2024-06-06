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
    // const { value: lastMeasurementValue, date } = lastDailyAverage || {};
    // const lastMeasurementDateLabel = moment(date).format("MMM D");
    // const lastUpdate = moment(fixedStreamData.stream.lastUpdate)
    //   .local()
    //   .format("HH:mm MMM D YYYY");
    // const active = fixedStreamData.stream.active;
    // const { min, low, middle, high, max } = fixedStreamData.stream;

    return {
      active: true,
      endTime: mobileStreamData.endTime.toString(),
      high: 0,
      lastMeasurementDateLabel: "",
      lastMeasurementValue: 0,
      lastUpdate: "",
      low: 0,
      max: 0,
      middle: 0,
      min: 0,
      profile: "",
      sensorName: "",
      sessionId: "",
      startTime: "",
      title: "",
      unitSymbol: "",
      updateFrequency: "",
    };
  }
);

export {
  selectMobileStreamData,
  selectMobileStreamPoints,
  selectMobileStreamShortInfo,
};
