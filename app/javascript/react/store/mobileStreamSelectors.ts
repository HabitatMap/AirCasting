import { createSelector } from "@reduxjs/toolkit";

import { Session } from "../components/Map/Markers/SessionType";
import { MobileStream } from "../types/mobileStream";
import { RootState } from "./";

const selectMobileStreamState = (state: RootState): MobileStream => {
  return state.mobileStream.data;
};

const selectMobileStreamData = createSelector(
  [selectMobileStreamState],
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

export { selectMobileStreamData, selectMobileStreamState };
