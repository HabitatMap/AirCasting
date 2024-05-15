import { AxiosResponse } from "axios";
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";

import { MovingStreamDailyAverage } from "../types/movingCalendarStream";
import { getErrorMessage } from "../utils/getErrorMessage";
import { API_ENDPOINTS } from "../api/apiEndpoints";
import { apiClient } from "../api/apiClient";
import { Error, StatusEnum } from "../types/api";

import type { RootState } from "./index";

interface MovingCalendarStreamState {
  data: MovingStreamDailyAverage[];
  status: StatusEnum;
  error?: Error;
}

const initialState: MovingCalendarStreamState = {
  data: [],
  status: StatusEnum.Idle,
};

interface MovingStreamParams {
  id: number;
  startDate: string;
  endDate: string;
}

export const fetchNewMovingStream = createAsyncThunk<
  MovingStreamDailyAverage[],
  MovingStreamParams,
  { rejectValue: { message: string } }
>(
  "movingCalendarStream/getData",
  async ({ id, startDate, endDate }, { rejectWithValue }) => {
    try {
      const response: AxiosResponse<MovingStreamDailyAverage[], Error> =
        await apiClient.get(
          API_ENDPOINTS.fetchSelectedDataRangeOfStream(id, startDate, endDate)
        );
      return response.data
    } catch (error) {
      const message = getErrorMessage(error);
      return rejectWithValue({ message });
    }
  }
);

export const movingStreamSlice = createSlice({
  name: "movingCalendarStream",
  initialState,
  reducers: {
    updateMovingStreamData: (
      state,
      action: PayloadAction<MovingStreamDailyAverage[]>
    ) => {
      state.data = action.payload;
      state.status = StatusEnum.Fulfilled;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNewMovingStream.fulfilled, (state, { payload }) => {
        state.status = StatusEnum.Fulfilled;
        state.data = payload
      })
      .addCase(fetchNewMovingStream.rejected, (state, { error }) => {
        state.status = StatusEnum.Rejected;
        state.error = { message: error.message };
        state.data = [];
      });
  },
});

export default movingStreamSlice.reducer;
export const { updateMovingStreamData } = movingStreamSlice.actions;
export const movingData = (state: RootState) => state.movingCalendarStream;
