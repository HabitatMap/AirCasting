import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AxiosResponse } from "axios";
import { apiClient } from "../api/apiClient";
import { API_ENDPOINTS } from "../api/apiEndpoints";
import { StatusEnum } from "../types/api";
import { TimelapseData, TimeRanges } from "../types/timelapse";
import { getErrorMessage } from "../utils/getErrorMessage";
import { RootState } from "./index";
import { logError } from "../utils/logController";

interface TimelapseState {
  data: TimelapseData;
  status: StatusEnum;
  error: string | null;
  isLoading: boolean;
  currentTimestamp: string | null;
  timelapseTimeRange: TimeRanges;
}

const initialState: TimelapseState = {
  data: {},
  status: StatusEnum.Idle,
  error: null,
  isLoading: false,
  currentTimestamp: null,
  timelapseTimeRange: TimeRanges.HOURS_24,
};

interface TimelapseFilters {
  filters: string;
}

export const fetchTimelapseData = createAsyncThunk<
  TimelapseData,
  TimelapseFilters,
  { rejectValue: string }
>(
  "timelapse/fetchData",
  async (sessionsData, { rejectWithValue }) => {
    try {
      const response: AxiosResponse<TimelapseData> = await apiClient.get(
        API_ENDPOINTS.fetchTimelapseData(sessionsData.filters)
      );
      return response.data;
    } catch (error) {
      const message = getErrorMessage(error);
      logError(error, {
        action: "fetchTimelapseData",
        endpoint: API_ENDPOINTS.fetchTimelapseData(sessionsData.filters),
        message,
      });
      return rejectWithValue(message);
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
    setTimelapseTimeRange(state, action: PayloadAction<TimeRanges>) {
      state.timelapseTimeRange = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchTimelapseData.pending, (state) => {
      state.status = StatusEnum.Pending;
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(
      fetchTimelapseData.fulfilled,
      (state, action: PayloadAction<TimelapseData>) => {
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
        state.error = action.payload || "An unknown error occurred";
        state.isLoading = false;
      }
    );
  },
});

export const { setCurrentTimestamp, setTimelapseTimeRange } =
  timelapseSlice.actions;
export default timelapseSlice.reducer;
