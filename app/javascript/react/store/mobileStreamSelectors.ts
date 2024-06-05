import { createSelector } from "@reduxjs/toolkit";

import { MobileStream } from "../types/mobileStream";
import { RootState } from "./";

const selectMobileStreamState = (state: RootState): MobileStream => {
  return state.mobileStream.data;
};

const selectMobileStreamData = createSelector(
  [selectMobileStreamState],
  (mobileStreamState) =>
    mobileStreamState.measurements.map(
      ({ time: id, value: lastMeasurementValue, latitude, longitude }) => ({
        id,
        lastMeasurementValue,
        latitude,
        longitude,
        streamId: mobileStreamState.streamId,
      })
    )
);

export { selectMobileStreamData, selectMobileStreamState };
