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
    {
      value: 6,
      latitude: 41.169722,
      longitude: -85.629444,
      sessions: 3,
    },
    {
      value: 4,
      latitude: 42.403964,
      longitude: -82.208306,
      sessions: 3,
    },
    {
      value: 15,
      latitude: 40.402267,
      longitude: -79.860942,
      sessions: 3,
    },
    {
      value: 11,
      latitude: 46.492002,
      longitude: -81.003099,
      sessions: 3,
    },
    {
      value: 13,
      latitude: 41.657155,
      longitude: -85.968446,
      sessions: 3,
    },
    {
      value: 3,
      latitude: 47.73333,
      longitude: -68.7072,
      sessions: 3,
    },
    {
      value: 7,
      latitude: 41.492191,
      longitude: -81.678552,
      sessions: 3,
    },
    {
      value: 4,
      latitude: 42.349954,
      longitude: -71.059194,
      sessions: 3,
    },
    {
      value: 5,
      latitude: 39.8356,
      longitude: -75.3725,
      sessions: 3,
    },
    {
      value: 7,
      latitude: 44.3106,
      longitude: -84.891899,
      sessions: 3,
    },
    {
      value: 5,
      latitude: 42.325197,
      longitude: -71.056056,
      sessions: 3,
    },
  ],
  "2024-08-20 09:00:00 UTC": [
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
    {
      value: 6,
      latitude: 41.169722,
      longitude: -85.629444,
      sessions: 3,
    },
    {
      value: 4,
      latitude: 42.403964,
      longitude: -82.208306,
      sessions: 3,
    },
    {
      value: 15,
      latitude: 40.402267,
      longitude: -79.860942,
      sessions: 3,
    },
    {
      value: 11,
      latitude: 46.492002,
      longitude: -81.003099,
      sessions: 3,
    },
    {
      value: 13,
      latitude: 41.657155,
      longitude: -85.968446,
      sessions: 3,
    },
    {
      value: 3,
      latitude: 47.73333,
      longitude: -68.7072,
      sessions: 3,
    },
    {
      value: 7,
      latitude: 41.492191,
      longitude: -81.678552,
      sessions: 3,
    },
    {
      value: 4,
      latitude: 42.349954,
      longitude: -71.059194,
      sessions: 3,
    },
    {
      value: 5,
      latitude: 39.8356,
      longitude: -75.3725,
      sessions: 3,
    },
    {
      value: 7,
      latitude: 44.3106,
      longitude: -84.891899,
      sessions: 3,
    },
    {
      value: 5,
      latitude: 42.325197,
      longitude: -71.056056,
      sessions: 3,
    },
  ],
  "2024-08-21 07:00:00 UTC": [
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
      sessions: 3,
    },
    {
      value: 6,
      latitude: 41.169722,
      longitude: -85.629444,
      sessions: 3,
    },
    {
      value: 4,
      latitude: 42.403964,
      longitude: -82.208306,
      sessions: 3,
    },
    {
      value: 15,
      latitude: 40.402267,
      longitude: -79.860942,
      sessions: 3,
    },
    {
      value: 60,
      latitude: 46.492002,
      longitude: -81.003099,
      sessions: 3,
    },
    {
      value: 13,
      latitude: 41.657155,
      longitude: -85.968446,
      sessions: 3,
    },
    {
      value: 3,
      latitude: 47.73333,
      longitude: -68.7072,
      sessions: 3,
    },
    {
      value: 77,
      latitude: 41.492191,
      longitude: -81.678552,
      sessions: 3,
    },
    {
      value: 4,
      latitude: 42.349954,
      longitude: -71.059194,
      sessions: 3,
    },
    {
      value: 5,
      latitude: 39.8356,
      longitude: -75.3725,
      sessions: 3,
    },
    {
      value: 7,
      latitude: 44.3106,
      longitude: -84.891899,
      sessions: 3,
    },
    {
      value: 44,
      latitude: 42.325197,
      longitude: -71.056056,
      sessions: 1,
    },
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
      const response: AxiosResponse<{ [timestamp: string]: SessionData[] }> =
        await apiClient.get(
          API_ENDPOINTS.fetchTimelapseData(sessionsData.filters)
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
