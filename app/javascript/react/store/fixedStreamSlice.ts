import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AxiosResponse } from 'axios';

import { getErrorMessage } from '../utils/getErrorMessage';
import { apiClient } from '../api/apiClient';
import { API_ENDPOINTS } from '../api/apiEndpoints';
import { Error, StatusEnum } from '../types/api';
import { FixedStream } from '../types/fixedStream';
import type { RootState } from './index';
import { calculateMeasurementStats } from '../utils/measurementsCalc';

interface FixedStreamState {
  data: FixedStream;
  status: StatusEnum;
  error?: Error;
}

const initialState: FixedStreamState = {
  data: {
    stream: {
      title: '',
      profile: '',
      lastUpdate: '',
      sensorName: '',
      unitSymbol: '',
      updateFrequency: '',
      active: true,
      sessionId: '',
      startTime: '',
      endTime: '',
      min: 0,
      low: 0,
      middle: 0,
      high: 0,
      max: 0,
      minMeasurementValue: 0,
      maxMeasurementValue: 0,
      averageMeasurementValue: 0,
    },
    measurements: [],
    streamDailyAverages: [],
  },
  status: StatusEnum.Idle,
};

export const fetchFixedStreamById = createAsyncThunk<
  FixedStream,
  number,
  { rejectValue: { message: string } }
>('fixedStream/getData', async (id: number, { rejectWithValue }) => {
  try {
    const response: AxiosResponse<FixedStream, Error> = await apiClient.get(
      API_ENDPOINTS.fetchFixedStreamById(id)
    );
    return response.data;
  } catch (error) {
    const message = getErrorMessage(error);
    return rejectWithValue({ message });
  }
});


const fixedStreamSlice = createSlice({
  name: 'fixedStream',
  initialState,
  reducers: {
    updateMeasurementStats(state, action: PayloadAction<{ min: number, max: number, avg: number }>) {
      state.data.stream.minMeasurementValue = action.payload.min;
      state.data.stream.maxMeasurementValue = action.payload.max;
      state.data.stream.averageMeasurementValue = action.payload.avg;
    },
    updateMeasurementExtremes(state, action: PayloadAction<{ min: number, max: number }>) {
      const { min, max } = action.payload;
      const measurementsInRange = state.data.measurements.filter(measurement => {
        const time = measurement.time;
        return time >= min && time <= max;
      });

      const values = measurementsInRange.map(m => m.value);
      const newMin = Math.min(...values);
      const newMax = Math.max(...values);
      const newAvg = values.reduce((sum, value) => sum + value, 0) / values.length;

      state.data.stream.minMeasurementValue = newMin;
      state.data.stream.maxMeasurementValue = newMax;
      state.data.stream.averageMeasurementValue = newAvg;
    }
  },
  extraReducers: (builder) => {
    builder.addCase(
      fetchFixedStreamById.fulfilled,
      (state, { payload }) => {
        state.status = StatusEnum.Fulfilled;

        if (payload) {
          state.data = {
            ...payload,
            stream: {
              ...payload.stream,
              minMeasurementValue: state.data.stream.minMeasurementValue,
              maxMeasurementValue: state.data.stream.maxMeasurementValue,
              averageMeasurementValue: state.data.stream.averageMeasurementValue,
            }
          };

          // Calculate and update measurement stats
          const stats = calculateMeasurementStats(payload.measurements);
          state.data.stream.minMeasurementValue = stats.min;
          state.data.stream.maxMeasurementValue = stats.max;
          state.data.stream.averageMeasurementValue = stats.avg;
        }
      }
    );
    builder.addCase(
      fetchFixedStreamById.rejected,
      (state, { payload }) => {
        state.status = StatusEnum.Rejected;
        state.error = payload;
        state.data = initialState.data;
      }
    );
  },
});

export const { updateMeasurementStats, updateMeasurementExtremes } = fixedStreamSlice.actions;
export default fixedStreamSlice.reducer;
export const selectFixedData = (state: RootState) => state.fixedStream.data;
