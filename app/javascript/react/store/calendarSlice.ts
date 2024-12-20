import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AxiosResponse } from "axios";
import { apiClient } from "../api/apiClient";
import { API_ENDPOINTS } from "../api/apiEndpoints";
import { ApiError, StatusEnum } from "../types/api";
import { StreamDailyAverage } from "../types/StreamDailyAverage";
import { getErrorMessage } from "../utils/getErrorMessage";
import { logError } from "../utils/logController";

import type { RootState } from "./index";

interface CalendarState {
  data: StreamDailyAverage[];
  status: StatusEnum;
  error: ApiError | null;
  selectedDate: number | null;
}

const initialState: CalendarState = {
  data: [],
  status: StatusEnum.Idle,
  error: null,
  selectedDate: null,
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

export const calendarSlice = createSlice({
  name: "calendar",
  initialState,
  reducers: {
    resetMovingStreamData: (state) => {
      state.data = [];
      state.status = StatusEnum.Idle;
      state.error = null;
    },
    setSelectedDate(state, action: PayloadAction<number | null>) {
      state.selectedDate = action.payload;
    },
  },
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

export default calendarSlice.reducer;
export const calendarData = (state: RootState) => state.calendar;
export const { resetMovingStreamData, setSelectedDate } = calendarSlice.actions;
