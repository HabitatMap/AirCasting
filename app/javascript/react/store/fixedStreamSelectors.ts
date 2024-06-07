import moment from "moment";

import { createSelector } from "@reduxjs/toolkit";

import {
  FixedStream,
  FixedStreamShortInfo,
  StreamDailyAverage,
} from "../types/fixedStream";
import { lastItemFromArray } from "../utils/lastArrayItem";
import { RootState } from "./";

const selectFixedStreamData = (state: RootState): FixedStream => {
  return state.fixedStream.data;
};

const selectLastDailyAverage = (
  state: RootState
): StreamDailyAverage | undefined => {
  const { streamDailyAverages } = selectFixedStreamData(state);

  return lastItemFromArray(streamDailyAverages);
};

const selectFixedStreamShortInfo = createSelector(
  [selectFixedStreamData, selectLastDailyAverage],
  (fixedStreamData, lastDailyAverage): FixedStreamShortInfo => {
    const { value: lastMeasurementValue, date } = lastDailyAverage || {};
    const lastMeasurementDateLabel = moment(date).format("MMM D");
    const lastUpdate = moment(fixedStreamData.stream.lastUpdate)
      .local()
      .format("HH:mm MMM D YYYY");
    const active = fixedStreamData.stream.active;
    const { min, low, middle, high, max } = fixedStreamData.stream;

    return {
      ...fixedStreamData.stream,
      lastMeasurementValue,
      lastMeasurementDateLabel,
      lastUpdate,
      active,
      min,
      low,
      middle,
      high,
      max,
      averageValue: lastMeasurementValue || 0,
      maxMeasurementValue: max,
      minMeasurementValue: min,
    };
  }
);

export { selectFixedStreamData, selectFixedStreamShortInfo };
