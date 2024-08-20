import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AxiosResponse } from "axios";
import { apiClient } from "../api/apiClient";
import { API_ENDPOINTS } from "../api/apiEndpoints";
import { StatusEnum } from "../types/api";
import { getErrorMessage } from "../utils/getErrorMessage";

import { RootState } from "./index";

interface Session {
  id: number;
  uuid: string;
  endTimeLocal: string;
  startTimeLocal: string;
  lastMeasurementValue: number;
  isIndoor: boolean;
  latitude: number;
  longitude: number;
  title: string;
  username: string;
  streams: {
    [key: string]: {
      streamDailyAverage: number;
      measurementShortType: string;
      sensorName: string;
      unitSymbol: string;
      id: number;
    };
  };
}
interface TimelapseData {
  [timestamp: string]: Session[];
}

interface TimelapseState {
  data: TimelapseData;
  status: StatusEnum;
  error?: string;
  isLoading: boolean;
  currentTimestamp: string | null;
}

const initialState: TimelapseState = {
  data: {},
  status: StatusEnum.Idle,
  isLoading: false,
  currentTimestamp: null,
};

interface TimelapseFilters {
  filters: string;
}

export const fetchTimelapseData = createAsyncThunk<
  { [timestamp: string]: Session[] },
  TimelapseFilters,
  { rejectValue: string }
>(
  "timelapse/fetchData",
  async (sessionsData, { rejectWithValue }) => {
    console.log(sessionsData, "sessionsData");
    try {
      const response: AxiosResponse<{ [timestamp: string]: Session[] }> =
        await apiClient.get(
          API_ENDPOINTS.fetchTimelapseData(sessionsData.filters)
        );

      console.log(response.data, "response.data");
      return response.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
  {
    condition: (_, { getState }) => {
      const { timelapse } = getState() as RootState;
      if (timelapse.status === StatusEnum.Pending) {
        return false;
      }
    },
  }
);

const timelapseSlice = createSlice({
  name: "timelapse",
  initialState,
  reducers: {
    setCurrentTimestamp(state, action: PayloadAction<string>) {
      state.currentTimestamp = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchTimelapseData.pending, (state) => {
      state.status = StatusEnum.Pending;
      state.isLoading = true;
      state.error = undefined;
    });
    builder.addCase(
      fetchTimelapseData.fulfilled,
      (state, action: PayloadAction<{ [timestamp: string]: Session[] }>) => {
        state.status = StatusEnum.Fulfilled;
        state.data = action.payload;
        state.isLoading = false;

        const timestamps = Object.keys(action.payload);
        if (timestamps.length > 0) {
          state.currentTimestamp = timestamps[timestamps.length - 1];
        }
      }
    );
    builder.addCase(
      fetchTimelapseData.rejected,
      (state, action: PayloadAction<string | undefined>) => {
        state.status = StatusEnum.Rejected;
        state.error = action.payload;
        state.isLoading = false;
      }
    );
  },
});

export const { setCurrentTimestamp } = timelapseSlice.actions;
export default timelapseSlice.reducer;

export const selectTimelapseData = (state: RootState) => state.timelapse.data;
export const selectCurrentTimestamp = (state: RootState) =>
  state.timelapse.currentTimestamp;
export const selectIsLoading = (state: RootState) => state.timelapse.isLoading;
