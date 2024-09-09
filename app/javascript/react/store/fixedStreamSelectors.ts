import { createSelector } from "@reduxjs/toolkit";
import moment from "moment";

import { DateFormat } from "../types/dateFormat";
import {
  FixedStream,
  FixedStreamShortInfo,
  StreamDailyAverage,
} from "../types/fixedStream";
import { lastItemFromArray } from "../utils/lastArrayItem";
import { RootState } from "./index";

const selectFixedStreamData = (state: RootState): FixedStream => {
  return state.fixedStream.data;
};

const selectFixedStream = (state: RootState) => state.fixedStream;

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

    const sortedStreamDailyAverages = [
      ...fixedStreamData.streamDailyAverages,
    ].sort((a, b) => moment(b.date).valueOf() - moment(a.date).valueOf());

    const newestAverageObject = sortedStreamDailyAverages[0];
    const newestAverageValue = newestAverageObject
      ? Number(newestAverageObject.value)
      : 0;

    const newestDate =
      fixedStreamData.measurements.length > 0
        ? moment(Math.max(...fixedStreamData.measurements.map((m) => m.time)))
        : moment();

    const newestDayMeasurements = fixedStreamData.measurements.filter((m) =>
      moment(m.time).isSame(newestDate, "day")
    );

    const maxMeasurementValue = Math.max(
      ...newestDayMeasurements.map((m) => m.value)
    );
    const minMeasurementValue = Math.min(
      ...newestDayMeasurements.map((m) => m.value)
    );

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
      minMeasurementValue,
      maxMeasurementValue,
      averageValue: newestAverageValue,
      startTime,
      endTime,
    };
  }
);

const selectFixedStreamStatus = (state: RootState) => state.fixedStream.status;

export {
  selectFixedStreamData,
  selectFixedStreamShortInfo,
  selectFixedStreamStatus,
};
