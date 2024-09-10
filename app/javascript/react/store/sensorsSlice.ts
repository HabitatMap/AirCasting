import {
  PayloadAction,
  createAsyncThunk,
  createSelector,
  createSlice,
} from "@reduxjs/toolkit";
import { AxiosResponse } from "axios";
import { RootState } from ".";
import { oldApiClient } from "../api/apiClient";
import { API_ENDPOINTS } from "../api/apiEndpoints";
import { ApiError, StatusEnum } from "../types/api";
import { SessionType } from "../types/filters";
import { Sensor } from "../types/sensors";
import { getErrorMessage } from "../utils/getErrorMessage";
import { logError } from "../utils/logController";

interface SensorsState {
  sensors: Sensor[];
  fetchSensorsStatus: StatusEnum;
  error: ApiError | null;
}

const initialState: SensorsState = {
  sensors: [],
  fetchSensorsStatus: StatusEnum.Idle,
  error: null,
};

export const fetchSensors = createAsyncThunk<
  Sensor[],
  SessionType,
  { rejectValue: ApiError }
>("sensors", async (sessionType, { rejectWithValue }) => {
  const sessionTypeCapitalized =
    sessionType[0].toUpperCase() + sessionType.slice(1);
  try {
    const response: AxiosResponse<Sensor[]> = await oldApiClient.get(
      API_ENDPOINTS.fetchSensors(sessionTypeCapitalized)
    );
    return response.data;
  } catch (error) {
    const message = getErrorMessage(error);

    const apiError: ApiError = {
      message,
      additionalInfo: {
        action: "fetchSensors",
        endpoint: API_ENDPOINTS.fetchSensors(sessionTypeCapitalized),
      },
    };

    logError(error, apiError);

    return rejectWithValue(apiError);
  }
});

const sensorsSlice = createSlice({
  name: "sensors",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSensors.pending, (state) => {
        state.fetchSensorsStatus = StatusEnum.Pending;
        state.error = null;
      })
      .addCase(
        fetchSensors.fulfilled,
        (state, action: PayloadAction<Sensor[]>) => {
          state.fetchSensorsStatus = StatusEnum.Fulfilled;
          state.sensors = action.payload;
          state.error = null;
        }
      )
      .addCase(
        fetchSensors.rejected,
        (state, action: PayloadAction<ApiError | undefined>) => {
          state.fetchSensorsStatus = StatusEnum.Rejected;
          state.error = action.payload || {
            message: "Unknown error occurred",
          };
        }
      );
  },
});

export const selectSensors = (state: RootState) => state.sensors.sensors;

export const selectParameters = createSelector(
  [selectSensors],
  (sensors): string[] => {
    const parameters = sensors.map((sensor) => sensor.measurementType);
    const parametersUnique = parameters.filter(
      (parameter, index) => parameters.indexOf(parameter) === index
    );
    return parametersUnique;
  }
);

export default sensorsSlice.reducer;
