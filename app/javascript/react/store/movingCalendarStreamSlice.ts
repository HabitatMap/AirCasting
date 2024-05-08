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
  MovingCalendarStreamState,
  MovingStreamParams,
  { rejectValue: { message: string } }
>(
  "movingCalendarStream/getData",
  async ({ id, startDate, endDate }, { rejectWithValue }) => {
    try {
      const response: AxiosResponse<MovingCalendarStreamState, Error> =
        await apiClient.get(
          API_ENDPOINTS.fetchPartoFMovingStream(id, startDate, endDate)
        );
      return response.data;
    } catch (error) {
      const message = getErrorMessage(error);
      return rejectWithValue({ message: endDate });
    }
  }
);

export const movingStreamSlice = createSlice({
    name: "movingCalendarStream",
    initialState,
    reducers: {
      updateMovingStreamData: (state, action: PayloadAction<MovingStreamDailyAverage[]>) => {
        state.data = action.payload;
        state.status = StatusEnum.Fulfilled;
      }
    },
    extraReducers: (builder) => {
      builder.addCase(fetchNewMovingStream.fulfilled, (state, { payload }) => {
        state.status = StatusEnum.Fulfilled;
        state.data = payload.data;
      })
      // .addCase(fetchNewMovingStream.rejected, (state, { error }) => {
      //   state.status = StatusEnum.Rejected;
      //   console.log("##", error.message)
      //   state.error = { message: error.message };
      //   state.data = [{date: error.message!, value: 10}]
      //   // state.data = [];
      // });
      .addCase(fetchNewMovingStream.rejected, (state, action) => {
        state.status = StatusEnum.Rejected;
        console.log("## Rejected with message:", action.payload?.message);  // This will log the endDate
        state.error = { message: action.payload?.message };  // Stores the endDate as error message
        state.data = [{ date: action.payload?.message ?? "", value: 10 }];  // Uses endDate in the data array
        // state.data = []; // Use this if you prefer to clear the data on error
      });
    },
  });

export default movingStreamSlice.reducer;
export const { updateMovingStreamData } = movingStreamSlice.actions;
export const movingData = (state: RootState) => state.movingCalendarStream;

