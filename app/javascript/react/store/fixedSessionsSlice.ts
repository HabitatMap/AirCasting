import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from ".";
import { API_ENDPOINTS } from "../api/apiEndpoints";
import { ApiError, StatusEnum } from "../types/api";
import { getErrorMessage } from "../utils/getErrorMessage";
import { logError } from "../utils/logController";
import { FixedSessionsTypes } from "./sessionFiltersSlice";

export interface FixedSession {
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

interface SessionsResponse {
  fetchableSessionsCount: number;
  sessions: FixedSession[];
}

interface SessionsState {
  fetchableSessionsCount: number;
  activeSessions: FixedSession[];
  dormantSessions: FixedSession[];
  isActiveSessionsFetched: boolean;
  isDormantSessionsFetched: boolean;
  status: StatusEnum;
  error: ApiError | null;
}

export interface SessionsData {
  filters: string;
  isAdditional?: boolean;
}

const initialState: SessionsState = {
  fetchableSessionsCount: 0,
  activeSessions: [],
  dormantSessions: [],
  isActiveSessionsFetched: false,
  isDormantSessionsFetched: false,
  status: StatusEnum.Idle,
  error: null,
};

const createSessionFetchThunk = (
  type: FixedSessionsTypes,
  endpoint: (filters: string) => string
) => {
  return createAsyncThunk<
    SessionsResponse,
    SessionsData,
    { rejectValue: ApiError }
  >(
    `sessions/fetch${
      type.charAt(0).toUpperCase() + type.slice(1)
    }FixedSessions`,
    async (sessionsData, { rejectWithValue }) => {
      try {
        // const response: AxiosResponse<SessionsResponse> =
        //   await oldApiClient.get(endpoint(sessionsData.filters));

        // return response.data;
        const mockResponse: SessionsResponse = {
          fetchableSessionsCount: mockData.length,
          sessions: mockData,
        };

        return mockResponse; // Return the mock data
      } catch (error) {
        const message = getErrorMessage(error);

        const apiError: ApiError = {
          message,
          additionalInfo: {
            action: `fetch${
              type.charAt(0).toUpperCase() + type.slice(1)
            }FixedSessions`,
            endpoint: endpoint(sessionsData.filters),
          },
        };

        logError(error, apiError);

        return rejectWithValue(apiError);
      }
    },
    {
      condition: (_, { getState }) => {
        const { fixedSessions } = getState() as RootState;
        return fixedSessions.status !== StatusEnum.Pending;
      },
    }
  );
};

export const fetchActiveFixedSessions = createSessionFetchThunk(
  FixedSessionsTypes.ACTIVE,
  API_ENDPOINTS.fetchActiveFixedSessions
);

export const fetchDormantFixedSessions = createSessionFetchThunk(
  FixedSessionsTypes.DORMANT,
  API_ENDPOINTS.fetchDormantFixedSessions
);

const fixedSessionsSlice = createSlice({
  name: "fixedSessions",
  initialState,
  reducers: {
    cleanSessions(state) {
      state.fetchableSessionsCount = 0;
      state.activeSessions = [];
      state.dormantSessions = [];
      state.isActiveSessionsFetched = false;
      state.isDormantSessionsFetched = false;
      state.status = StatusEnum.Idle;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchActiveFixedSessions.pending, (state) => {
        state.status = StatusEnum.Pending;
        state.error = null;
      })
      .addCase(
        fetchActiveFixedSessions.fulfilled,
        (state, action: PayloadAction<SessionsResponse>) => {
          state.status = StatusEnum.Fulfilled;
          state.activeSessions = action.payload.sessions;
          state.fetchableSessionsCount = action.payload.fetchableSessionsCount;
          state.isActiveSessionsFetched = true;
          state.error = null;
        }
      )
      .addCase(
        fetchActiveFixedSessions.rejected,
        (state, action: PayloadAction<ApiError | undefined>) => {
          state.status = StatusEnum.Rejected;
          state.error = action.payload || { message: "Unknown error occurred" };
        }
      );
    builder
      .addCase(fetchDormantFixedSessions.pending, (state) => {
        state.status = StatusEnum.Pending;
        state.error = null;
      })
      .addCase(fetchDormantFixedSessions.fulfilled, (state, action) => {
        state.status = StatusEnum.Fulfilled;
        state.dormantSessions = action.meta?.arg.isAdditional
          ? [...state.dormantSessions, ...action.payload.sessions]
          : action.payload.sessions;
        state.fetchableSessionsCount = action.payload.fetchableSessionsCount;
        state.isDormantSessionsFetched = true;
        state.error = null;
      })
      .addCase(
        fetchDormantFixedSessions.rejected,
        (state, action: PayloadAction<ApiError | undefined>) => {
          state.status = StatusEnum.Rejected;
          state.error = action.payload || { message: "Unknown error occurred" };
        }
      );
  },
});

export const { cleanSessions } = fixedSessionsSlice.actions;
export default fixedSessionsSlice.reducer;

const data = [
  {
    id: 1879647,
    uuid: "f831b94a-3c7e-4414-a5ad-afd256a5e570",
    end_time_local: "2024-09-23T02:00:00.000Z",
    start_time_local: "2024-04-24T11:00:00.000Z",
    last_measurement_value: 5,
    is_indoor: false,
    latitude: 30.4889,
    longitude: -87.8706,
    title: "FAIRHOPE",
    username: "username",
    is_active: true,
    streams: {
      "Government-PM2.5": {
        measurement_short_type: "PM",
        sensor_name: "Government-PM2.5",
        unit_symbol: "µg/m³",
        id: 2595983,
        stream_daily_average: 6,
      },
    },
  },
  {
    id: 1879874,
    uuid: "c3fbc48a-40f0-44c3-9043-6e2c45dd577c",
    end_time_local: "2024-09-23T02:00:00.000Z",
    start_time_local: "2024-04-24T11:00:00.000Z",
    last_measurement_value: 24,
    is_indoor: false,
    latitude: 30.7697,
    longitude: -88.0875,
    title: "Chickasaw",
    username: "username",
    is_active: true,
    streams: {
      "Government-PM2.5": {
        measurement_short_type: "PM",
        sensor_name: "Government-PM2.5",
        unit_symbol: "µg/m³",
        id: 2595997,
        stream_daily_average: 18,
      },
    },
  },
  {
    id: 1880176,
    uuid: "b6c33b69-9f3a-4066-9fb0-cc1f457b035b",
    end_time_local: "2024-09-23T02:00:00.000Z",
    start_time_local: "2024-04-24T11:00:00.000Z",
    last_measurement_value: 5,
    is_indoor: false,
    latitude: 32.36253,
    longitude: -88.27792,
    title: "Ward",
    username: "username",
    is_active: true,
    streams: {
      "Government-PM2.5": {
        measurement_short_type: "PM",
        sensor_name: "Government-PM2.5",
        unit_symbol: "µg/m³",
        id: 2596005,
        stream_daily_average: 6,
      },
    },
  },
  {
    id: 1879660,
    uuid: "bed75e7d-bfbc-444a-814d-baa3f2820c7b",
    end_time_local: "2024-09-23T02:00:00.000Z",
    start_time_local: "2024-04-24T11:00:00.000Z",
    last_measurement_value: 28,
    is_indoor: false,
    latitude: 34.756058,
    longitude: -92.281034,
    title: "PARR",
    username: "username",
    is_active: true,
    streams: {
      "Government-PM2.5": {
        measurement_short_type: "PM",
        sensor_name: "Government-PM2.5",
        unit_symbol: "µg/m³",
        id: 2596075,
        stream_daily_average: 25,
      },
    },
  },
  {
    id: 1875019,
    uuid: "cc68d788-5670-4c46-a674-25719c5999a8",
    end_time_local: "2024-09-23T01:00:00.000Z",
    start_time_local: "2024-04-24T11:00:00.000Z",
    last_measurement_value: 4,
    is_indoor: false,
    latitude: 40.052241,
    longitude: -88.372549,
    title: "BONDVILLE",
    username: "username",
    is_active: true,
    streams: {
      "Government-PM2.5": {
        measurement_short_type: "PM",
        sensor_name: "Government-PM2.5",
        unit_symbol: "µg/m³",
        id: 2596708,
        stream_daily_average: 4,
      },
    },
  },
  {
    id: 1879790,
    uuid: "5f0757fb-ac16-4ae7-a875-8f70d4dccdd7",
    end_time_local: "2024-09-23T02:00:00.000Z",
    start_time_local: "2024-04-24T11:00:00.000Z",
    last_measurement_value: 2,
    is_indoor: false,
    latitude: 41.6708,
    longitude: -87.7325,
    title: "ALSIP",
    username: "username",
    is_active: true,
    streams: {
      "Government-PM2.5": {
        measurement_short_type: "PM",
        sensor_name: "Government-PM2.5",
        unit_symbol: "µg/m³",
        id: 2596712,
        stream_daily_average: 2,
      },
    },
  },
  {
    id: 1875024,
    uuid: "0d961ac2-af7a-40b1-a477-bd0c28ce364c",
    end_time_local: "2024-09-23T02:00:00.000Z",
    start_time_local: "2024-04-24T11:00:00.000Z",
    last_measurement_value: 2,
    is_indoor: false,
    latitude: 41.9136,
    longitude: -87.7239,
    title: "CHI_SP",
    username: "username",
    is_active: true,
    streams: {
      "Government-PM2.5": {
        measurement_short_type: "PM",
        sensor_name: "Government-PM2.5",
        unit_symbol: "µg/m³",
        id: 2596714,
        stream_daily_average: 2,
      },
    },
  },
  {
    id: 1879792,
    uuid: "2f0fd824-9bd4-4998-9c92-c2d5f4e1b74b",
    end_time_local: "2024-09-23T02:00:00.000Z",
    start_time_local: "2024-04-24T11:00:00.000Z",
    last_measurement_value: 3,
    is_indoor: false,
    latitude: 41.965,
    longitude: -87.8761,
    title: "SCHILPRK",
    username: "username",
    is_active: true,
    streams: {
      "Government-PM2.5": {
        measurement_short_type: "PM",
        sensor_name: "Government-PM2.5",
        unit_symbol: "µg/m³",
        id: 2596720,
        stream_daily_average: 3,
      },
    },
  },
  {
    id: 1880470,
    uuid: "20e2de41-be29-4b75-bafd-fced3f303550",
    end_time_local: "2024-09-23T02:00:00.000Z",
    start_time_local: "2024-04-24T11:00:00.000Z",
    last_measurement_value: 2,
    is_indoor: false,
    latitude: 42.0603,
    longitude: -87.8631,
    title: "DESPLNS",
    username: "username",
    is_active: true,
    streams: {
      "Government-PM2.5": {
        measurement_short_type: "PM",
        sensor_name: "Government-PM2.5",
        unit_symbol: "µg/m³",
        id: 2596723,
        stream_daily_average: 2,
      },
    },
  },
  {
    id: 1875031,
    uuid: "05e27f72-d4ed-478a-8096-4e6e4bee6c20",
    end_time_local: "2024-09-23T02:00:00.000Z",
    start_time_local: "2024-04-24T11:00:00.000Z",
    last_measurement_value: 2,
    is_indoor: false,
    latitude: 42.1406,
    longitude: -87.7994,
    title: "NORTHBRK",
    username: "username",
    is_active: true,
    streams: {
      "Government-PM2.5": {
        measurement_short_type: "PM",
        sensor_name: "Government-PM2.5",
        unit_symbol: "µg/m³",
        id: 2596724,
        stream_daily_average: 2,
      },
    },
  },
];
const mapToFixedSession = (session: any): FixedSession => ({
  id: session.id,
  uuid: session.uuid,
  endTimeLocal: session.end_time_local,
  startTimeLocal: session.start_time_local,
  lastMeasurementValue: session.last_measurement_value,
  isIndoor: session.is_indoor,
  latitude: session.latitude,
  longitude: session.longitude,
  title: session.title,
  username: session.username,
  streams: session.streams,
});

const mockData: FixedSession[] = data.map(mapToFixedSession);
