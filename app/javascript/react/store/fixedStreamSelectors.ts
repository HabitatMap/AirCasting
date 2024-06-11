import moment from 'moment';
import { createSelector } from '@reduxjs/toolkit';
import {
  FixedStream,
  FixedStreamShortInfo,
  StreamDailyAverage,
} from '../types/fixedStream';
import { lastItemFromArray } from '../utils/lastArrayItem';
import { RootState } from './index';

const selectFixedStreamData = (state: RootState): FixedStream => {
  return state.fixedStream.data;
};

const selectExtremes = (state: RootState): { minMeasurementValue: number; maxMeasurementValue: number; averageValue: number; } => {
  const { averageMeasurementValue, minMeasurementValue, maxMeasurementValue } = state.fixedStream;
  return {
    minMeasurementValue: Math.round(minMeasurementValue),
    maxMeasurementValue: Math.round(maxMeasurementValue),
    averageValue: Math.round(averageMeasurementValue),
  };
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
    const { value: lastMeasurementValue, date } = lastDailyAverage || {};
    const lastMeasurementDateLabel = moment(date).format('MMM D');
    const lastUpdate = moment(fixedStreamData.stream.lastUpdate)
      .local()
      .format('HH:mm MMM D YYYY');
    const active = fixedStreamData.stream.active;
    const { min, low, middle, high, max, } = fixedStreamData.stream;
    const maxMeasurementValue = Math.max(
      ...fixedStreamData.measurements.map((m) => m.value)
    );
    const minMeasurementValue = Math.min(
      ...fixedStreamData.measurements.map((m) => m.value)
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
      averageValue: lastMeasurementValue || 0,
    };
  }
);

export { selectFixedStreamData, selectFixedStreamShortInfo, selectExtremes };
