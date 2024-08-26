import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AxiosResponse } from "axios";
import { apiClient } from "../api/apiClient";
import { API_ENDPOINTS } from "../api/apiEndpoints";
import { StatusEnum } from "../types/api";
import { getErrorMessage } from "../utils/getErrorMessage";
import { RootState } from "./index";

const mockData = {
  "2024-08-20 08:00:00 UTC": [
    {
      value: 6,
      latitude: 40.42735,
      longitude: -80.59253,
      sessions: 1,
    },
    {
      value: 7,
      latitude: 41.615,
      longitude: -71.7197,
      sessions: 3,
    },
    {
      value: 4,
      latitude: 39.9233,
      longitude: -77.3081,
      sessions: 1,
    },
    // more entries...
  ],
  "2024-08-20 09:00:00 UTC": [
    // similar data as above
  ],
  // More data for the remaining days...
  "2024-08-21 07:00:00 UTC": [
    // similar data as above
  ],
  "2024-08-22 08:00:00 UTC": [
    {
      value: 10,
      latitude: 39.77,
      longitude: -75.23,
      sessions: 2,
    },
    {
      value: 12,
      latitude: 40.5,
      longitude: -73.95,
      sessions: 1,
    },
    // more entries...
  ],
  "2024-08-23 08:00:00 UTC": [
    {
      value: 8,
      latitude: 39.3,
      longitude: -74.65,
      sessions: 3,
    },
    {
      value: 14,
      latitude: 41.22,
      longitude: -72.97,
      sessions: 2,
    },
    // more entries...
  ],
  "2024-08-24 08:00:00 UTC": [
    {
      value: 7,
      latitude: 38.77,
      longitude: -76.92,
      sessions: 3,
    },
    {
      value: 9,
      latitude: 40.0,
      longitude: -75.0,
      sessions: 3,
    },
    // more entries...
  ],
  "2024-08-25 08:00:00 UTC": [
    {
      value: 11,
      latitude: 39.3,
      longitude: -76.61,
      sessions: 2,
    },
    {
      value: 13,
      latitude: 41.61,
      longitude: -72.65,
      sessions: 3,
    },
    // more entries...
  ],
  "2024-08-26 08:00:00 UTC": [
    {
      value: 9,
      latitude: 40.77,
      longitude: -73.97,
      sessions: 1,
    },
    {
      value: 15,
      latitude: 42.35,
      longitude: -71.08,
      sessions: 3,
    },
    // more entries...
  ],
};

interface SessionData {
  value: number;
  latitude: number;
  longitude: number;
  sessions: number;
}

interface TimelapseState {
  data: { [timestamp: string]: SessionData[] };
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
  zoom: number;
}

// const initialState: TimelapseState = {
//   data: mockData, // Use mock data as the initial state
//   status: StatusEnum.Idle,
//   isLoading: false,
//   currentTimestamp: Object.keys(mockData)[0] || null, // Set the initial timestamp
// };

// interface TimelapseFilters {
//   filters: string;
// }
// export const fetchTimelapseData = createAsyncThunk<
//   { [timestamp: string]: SessionData[] },
//   TimelapseFilters,
//   { rejectValue: string }
// >("timelapse/fetchData", async (_, { rejectWithValue }) => {
//   try {
//     // Simulate an API response delay
//     await new Promise((resolve) => setTimeout(resolve, 500));

//     // Return the mock data as the response
//     return mockData;
//   } catch (error) {
//     return rejectWithValue("Failed to fetch timelapse data");
//   }
// });

export const fetchTimelapseData = createAsyncThunk<
  { [timestamp: string]: SessionData[] },
  TimelapseFilters,
  { rejectValue: string }
>(
  "timelapse/fetchData",
  async (sessionsData, { rejectWithValue }) => {
    try {
      const zoomLevel = sessionsData.zoom.toString();

      const response: AxiosResponse<{ [timestamp: string]: SessionData[] }> =
        await apiClient.get(
          API_ENDPOINTS.fetchTimelapseData(sessionsData.filters, zoomLevel)
        );

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
      (
        state,
        action: PayloadAction<{ [timestamp: string]: SessionData[] }>
      ) => {
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
export const selectTimelapseIsLoading = (state: RootState) =>
  state.timelapse.isLoading;
