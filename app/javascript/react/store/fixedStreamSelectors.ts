import { createSelector } from "@reduxjs/toolkit";
import moment from "moment";

import { lastItemFromArray } from "../utils/lastArrayItem";
import {
  FixedStream,
  FixedStreamShortInfo,
  StreamDailyAverage,
} from "../types/fixedStream";
import { RootState } from ".";

const selectFixedStreamData = (state: RootState): FixedStream => {
  return state.fixedStream.data;
}

const selectLastDailyAverage = (
  state: RootState
): StreamDailyAverage | undefined => {
  const { streamDailyAverages } = selectFixedStreamData(state);

  return lastItemFromArray(streamDailyAverages);
};

const selectFixedStreamShortInfo = createSelector(
  [selectFixedStreamData, selectLastDailyAverage],
  (fixedStreamData, lastDailyAverage): FixedStreamShortInfo => {
    console.log(fixedStreamData)
    const { value: lastMeasurementValue, date } = lastDailyAverage || {};
    const lastMeasurementDateLabel = moment(date).format("MMM D");
    const active = fixedStreamData.stream.active;
    const sessionId = fixedStreamData.stream.sessionId;
    const lastUpdate = moment(fixedStreamData.stream.lastUpdate)
      .local()
      .format("HH:mm MMM D YYYY");

    return {
      ...fixedStreamData.stream,
      lastMeasurementValue,
      lastMeasurementDateLabel,
      lastUpdate,
      active,
      sessionId,
    };
  }
);

export {
  selectFixedStreamData,
  selectFixedStreamShortInfo,
};
