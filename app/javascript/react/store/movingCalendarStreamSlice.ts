import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AxiosResponse } from "axios";
import { apiClient } from "../api/apiClient";
import { API_ENDPOINTS } from "../api/apiEndpoints";
import { ApiError, StatusEnum } from "../types/api";
import { StreamDailyAverage } from "../types/StreamDailyAverage";
import { getErrorMessage } from "../utils/getErrorMessage";
import { logError } from "../utils/logController";

import type { RootState } from "./index";

interface CalendarStreamState {
  data: StreamDailyAverage[];
  status: StatusEnum;
  error: ApiError | null;
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
  { rejectValue: ApiError }
>(
  "movingCalendarStream/getData",
  async ({ id, startDate, endDate }, { rejectWithValue }) => {
    console.log(startDate, endDate, "startDate, endDate");
    try {
      const response: AxiosResponse<StreamDailyAverage[]> = await apiClient.get(
        API_ENDPOINTS.fetchSelectedDataRangeOfStream(id, startDate, endDate)
      );
      return response.data;
    } catch (error) {
      const message = getErrorMessage(error);

      const apiError: ApiError = {
        message,
        additionalInfo: {
          action: "fetchNewMovingStream",
          endpoint: API_ENDPOINTS.fetchSelectedDataRangeOfStream(
            id,
            startDate,
            endDate
          ),
        },
      };

      logError(error, apiError);

      return rejectWithValue(apiError);
    }
  }
);

export const movingStreamSlice = createSlice({
  name: "movingCalendarStream",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(
        fetchNewMovingStream.fulfilled,
        (state, action: PayloadAction<StreamDailyAverage[]>) => {
          state.status = StatusEnum.Fulfilled;
          state.data = action.payload;
          state.data.sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
          );
          state.error = null;
        }
      )
      .addCase(
        fetchNewMovingStream.rejected,
        (state, action: PayloadAction<ApiError | undefined>) => {
          state.status = StatusEnum.Rejected;
          state.error = action.payload || { message: "Unknown error occurred" };
          state.data = [];
        }
      );
  },
});

export default movingStreamSlice.reducer;
export const movingData = (state: RootState) => state.movingCalendarStream;
