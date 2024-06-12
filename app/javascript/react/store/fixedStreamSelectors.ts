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


const selectExtremesValues = (state: RootState) => {
  return state.fixedStream;
}

 const selectExtremes = createSelector(
  [selectExtremesValues],
  (fixedStream) => {
    const { averageMeasurementValue, minMeasurementValue, maxMeasurementValue } = fixedStream;
    return {
      minMeasurementValue: Math.round(minMeasurementValue),
      maxMeasurementValue: Math.round(maxMeasurementValue),
      averageValue: Math.round(averageMeasurementValue),
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
    const lastMeasurementDateLabel = moment(date).format('MMM D');
    const lastUpdate = moment(fixedStreamData.stream.lastUpdate)
      .local()
      .format('HH:mm MMM D YYYY');
    const active = fixedStreamData.stream.active;
    const { min, low, middle, high, max } = fixedStreamData.stream;

    const sortedStreamDailyAverages = [...fixedStreamData.streamDailyAverages].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const newestAverageObject = sortedStreamDailyAverages[0];
    const newestAverageValue = newestAverageObject ? Number(newestAverageObject.value) : 0;


      const newestDate = new Date(Math.max(...fixedStreamData.measurements.map(m => m.time)));

      const newestDayMeasurements = fixedStreamData.measurements.filter(m =>
        new Date(m.time).toDateString() === newestDate.toDateString()
      );

      const maxMeasurementValue = Math.max(...newestDayMeasurements.map((m) => m.value));
      const minMeasurementValue = Math.min(...newestDayMeasurements.map((m) => m.value));


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
    };
  }
);

export { selectFixedStreamData, selectFixedStreamShortInfo, selectExtremes };
