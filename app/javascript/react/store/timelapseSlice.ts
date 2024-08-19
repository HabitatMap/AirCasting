import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { StatusEnum } from "../types/api";
import { Session } from "../types/sessionType";
import { RootState } from "./index";

interface TimelapseState {
  data: { [timestamp: string]: Session[] };
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
interface Point {
  lat: number;
  lng: number;
  streamId: string;
}

interface TimelapseStream {
  id: number;
  title: string;
  sensorName: string;
  startTime: string;
  endTime: string;
  lastMeasurementValue: number;
  point: Point;
  streams: {
    sensor_name: {
      id: number;
    };
  };
}

interface TimelapseData {
  [timestamp: string]: TimelapseStream[];
}
const mockTimelapseData: TimelapseData = {
  "2024-08-19T13:00:00.000Z": [
    {
      id: 1851585,
      title: "Portland Tukey's Bridge",
      sensorName: "Government-PM2.5",
      startTime: "2024-05-28T08:00:00.000Z",
      endTime: "2024-08-19T13:00:00.000Z",
      lastMeasurementValue: 8,
      point: {
        lat: 43.678,
        lng: -70.2561,
        streamId: "2497685",
      },
      streams: {
        sensor_name: {
          id: 1851585,
        },
      },
    },
    {
      id: 1849400,
      title: "Saint-Faustin-Lac-Carr?",
      sensorName: "Government-PM2.5",
      startTime: "2024-05-29T06:00:00.000Z",
      endTime: "2024-08-19T14:00:00.000Z",
      lastMeasurementValue: 2,
      point: {
        lat: 46.035,
        lng: -74.4819,
        streamId: "2495500",
      },
      streams: {
        sensor_name: {
          id: 1849400,
        },
      },
    },
  ],
  "2024-08-19T14:00:00.000Z": [
    {
      id: 1851585,
      title: "Portland Tukey's Bridge",
      sensorName: "Government-PM2.5",
      startTime: "2024-05-28T08:00:00.000Z",
      endTime: "2024-08-19T13:00:00.000Z",
      lastMeasurementValue: 48,
      point: {
        lat: 43.678,
        lng: -70.2561,
        streamId: "2497685",
      },
      streams: {
        sensor_name: {
          id: 1851585,
        },
      },
    },
    {
      id: 1849400,
      title: "Saint-Faustin-Lac-Carr?",
      sensorName: "Government-PM2.5",
      startTime: "2024-05-29T06:00:00.000Z",
      endTime: "2024-08-19T14:00:00.000Z",
      lastMeasurementValue: 67,
      point: {
        lat: 46.035,
        lng: -74.4819,
        streamId: "2495500",
      },
      streams: {
        sensor_name: {
          id: 1849400,
        },
      },
    },
  ],
  "2024-08-19T15:00:00.000Z": [
    {
      id: 1851585,
      title: "Portland Tukey's Bridge",
      sensorName: "Government-PM2.5",
      startTime: "2024-05-28T08:00:00.000Z",
      endTime: "2024-08-19T13:00:00.000Z",
      lastMeasurementValue: 88,
      point: {
        lat: 43.678,
        lng: -70.2561,
        streamId: "2497685",
      },
      streams: {
        sensor_name: {
          id: 1851585,
        },
      },
    },
    {
      id: 1849400,
      title: "Saint-Faustin-Lac-Carr?",
      sensorName: "Government-PM2.5",
      startTime: "2024-05-29T06:00:00.000Z",
      endTime: "2024-08-19T14:00:00.000Z",
      lastMeasurementValue: 27,
      point: {
        lat: 46.035,
        lng: -74.4819,
        streamId: "2495500",
      },
      streams: {
        sensor_name: {
          id: 1849400,
        },
      },
    },
  ],
};

export const fetchTimelapseData = createAsyncThunk<
  TimelapseData,
  { streamIds: string[]; timePeriod: number }
>("timelapse/fetchTimelapseData", async ({ streamIds, timePeriod }) => {
  return new Promise<TimelapseData>((resolve) => {
    setTimeout(() => {
      resolve(mockTimelapseData);
    }, 500);
  });
});

const timelapseSlice = createSlice({
  name: "timelapse",
  initialState: {
    data: {},
    currentTimestamp: null,
  },
  reducers: {
    setCurrentTimestamp(state, action) {
      state.currentTimestamp = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchTimelapseData.fulfilled, (state, action) => {
      state.data = action.payload;
    });
  },
});

// export const fetchTimelapseData = createAsyncThunk<
//   { [timestamp: string]: Session[] },
//   { streamIds: string[]; timePeriod: number },
//   { rejectValue: string }
// >(
//   "timelapse/fetchData",
//   async ({ streamIds, timePeriod }, { rejectWithValue }) => {
//     try {
//       const response: AxiosResponse<{ [timestamp: string]: Session[] }> =
//         await apiClient.post(API_ENDPOINTS.fetchTimelapseData(), {
//           streamIds,
//           time_period: timePeriod,
//         });
//       return response.data;
//     } catch (error) {
//       return rejectWithValue(getErrorMessage(error));
//     }
//   }
// );

// const timelapseSlice = createSlice({
//   name: "timelapse",
//   initialState,
//   reducers: {
//     setCurrentTimestamp(state, action: PayloadAction<string>) {
//       state.currentTimestamp = action.payload;
//     },
//   },
//   extraReducers: (builder) => {
//     builder.addCase(fetchTimelapseData.pending, (state) => {
//       state.status = StatusEnum.Pending;
//       state.isLoading = true;
//       state.error = undefined;
//     });
//     builder.addCase(
//       fetchTimelapseData.fulfilled,
//       (state, action: PayloadAction<{ [timestamp: string]: Session[] }>) => {
//         state.status = StatusEnum.Fulfilled;
//         state.data = action.payload;
//         state.isLoading = false;

//         // Automatically set the current timestamp to the latest one
//         const timestamps = Object.keys(action.payload);
//         if (timestamps.length > 0) {
//           state.currentTimestamp = timestamps[timestamps.length - 1];
//         }
//       }
//     );
//     builder.addCase(
//       fetchTimelapseData.rejected,
//       (state, action: PayloadAction<string | undefined>) => {
//         state.status = StatusEnum.Rejected;
//         state.error = action.payload;
//         state.isLoading = false;
//       }
//     );
//   },
// });

export const { setCurrentTimestamp } = timelapseSlice.actions;
export default timelapseSlice.reducer;

export const selectTimelapseData = (state: RootState) => state.timelapse.data;
export const selectCurrentTimestamp = (state: RootState) =>
  state.timelapse.currentTimestamp;
// export const selectIsLoading = (state: RootState) => state.timelapse.isLoading;
