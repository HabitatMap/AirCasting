import { AxiosResponse } from "axios";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { StreamDailyAverage } from "../types/StreamDailyAverage";
import { getErrorMessage } from "../utils/getErrorMessage";
import { API_ENDPOINTS } from "../api/apiEndpoints";
import { apiClient } from "../api/apiClient";
import { logError } from "../utils/logController";
import { StatusEnum } from "../types/api";

import type { RootState } from "./index";

interface CalendarStreamState {
  data: StreamDailyAverage[];
  status: StatusEnum;
  error: string | null;
}

const initialState: CalendarStreamState = {
  data: [],
  status: StatusEnum.Idle,
  error: null,
};

interface MovingStreamParams {
  id: number;
  startDate: string;
  endDate: string;
}

export const fetchNewMovingStream = createAsyncThunk<
  StreamDailyAverage[],
  MovingStreamParams,
  { rejectValue: string }
>(
  "movingCalendarStream/getData",
  async ({ id, startDate, endDate }, { rejectWithValue }) => {
    try {
      const response: AxiosResponse<StreamDailyAverage[]> = await apiClient.get(
        API_ENDPOINTS.fetchSelectedDataRangeOfStream(id, startDate, endDate)
      );
      return response.data;
    } catch (error) {
      const message = getErrorMessage(error);
      logError(error, {
        action: "fetchNewMovingStream",
        endpoint: API_ENDPOINTS.fetchSelectedDataRangeOfStream(
          id,
          startDate,
          endDate
        ),
        message,
      });
      return rejectWithValue(message);
    }
  }
);

export const movingStreamSlice = createSlice({
  name: "movingCalendarStream",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchNewMovingStream.fulfilled, (state, { payload }) => {
        state.status = StatusEnum.Fulfilled;
        state.data = payload;
        state.data.sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        state.error = null;
      })
      .addCase(fetchNewMovingStream.rejected, (state, { payload }) => {
        state.status = StatusEnum.Rejected;
        state.error = payload || "Unknown error occurred";
        state.data = [];
      });
  },
});

export default movingStreamSlice.reducer;
export const movingData = (state: RootState) => state.movingCalendarStream;
