import { createSelector } from "@reduxjs/toolkit";
import moment from "moment";

import { DateFormat } from "../types/dateFormat";
import {
  FixedStream,
  FixedStreamShortInfo,
  StreamDailyAverage,
} from "../types/fixedStream";
import { lastItemFromArray } from "../utils/lastArrayItem";
import { isValidValue } from "../utils/measurementsCalc";
import { RootState } from "./index";

const selectFixedStreamData = (state: RootState): FixedStream => {
  return state.fixedStream.data;
};

const selectFixedStream = (state: RootState) => state.fixedStream;

const selectFixedExtremes = createSelector(
  [selectFixedStream],
  (fixedStream) => {
    const {
      averageMeasurementValue,
      minMeasurementValue,
      maxMeasurementValue,
    } = fixedStream;

    const min = isValidValue(minMeasurementValue)
      ? Math.round(minMeasurementValue!)
      : null;
    const max = isValidValue(maxMeasurementValue)
      ? Math.round(maxMeasurementValue!)
      : null;
    const avg = isValidValue(averageMeasurementValue)
      ? Math.round(averageMeasurementValue!)
      : null;

    return {
      minMeasurementValue: min,
      maxMeasurementValue: max,
      averageValue: avg,
    };
  }
);

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
    const lastUpdate = moment
      .utc(fixedStreamData.stream.lastUpdate)

      .format("HH:mm MMM D YYYY");
    const startTime = moment
      .utc(fixedStreamData.stream.startTime)
      .format(DateFormat.us_with_time);
    const endTime = moment
      .utc(fixedStreamData.stream.endTime)
      .format(DateFormat.us_with_time);

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
      startTime,
      endTime,
    };
  }
);

const selectFixedStreamStatus = (state: RootState) => state.fixedStream.status;

export {
  selectFixedExtremes,
  selectFixedStreamData,
  selectFixedStreamShortInfo,
  selectFixedStreamStatus,
};
