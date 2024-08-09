import { PayloadAction, createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { AxiosResponse } from "axios";
import { RootState } from ".";
import { oldApiClient } from "../api/apiClient";
import { API_ENDPOINTS } from "../api/apiEndpoints";
import { StatusEnum } from "../types/api";
import { SessionType } from "../types/filters";
import { Sensor } from "../types/sensors";
import { getErrorMessage } from "../utils/getErrorMessage";

interface SensorsState {
  sensors: Sensor[];
  fetchSensorsStatus: StatusEnum;
}

const initialState: SensorsState = {
  sensors: [],
  fetchSensorsStatus: StatusEnum.Idle,
};

export const fetchSensors = createAsyncThunk(
  "sensors",
  async (sessionType: SessionType, { rejectWithValue }) => {
    const sessionTypeCapitalized =
      sessionType[0].toUpperCase() + sessionType.slice(1);
    try {
      const response: AxiosResponse<Sensor[]> = await oldApiClient.get(
        API_ENDPOINTS.fetchSensors(sessionTypeCapitalized)
      );
      return response.data;
    } catch (error) {
      const message = getErrorMessage(error);
      return rejectWithValue(message);
    }
  }
);

const sensorsSlice = createSlice({
  name: "sensors",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSensors.pending, (state) => {
        state.fetchSensorsStatus = StatusEnum.Pending;
      })
      .addCase(
        fetchSensors.fulfilled,
        (state, action: PayloadAction<Sensor[]>) => {
          state.fetchSensorsStatus = StatusEnum.Fulfilled;
          state.sensors = action.payload;
        }
      )
      .addCase(fetchSensors.rejected, (state) => {
        state.fetchSensorsStatus = StatusEnum.Rejected;
      });
  },
});

export const selectSensors = (state: RootState) => state.sensors.sensors;

export const selectParameters = (state: RootState) => {
  const parameters = state.sensors.sensors.map(
    (sensor) => sensor.measurementType
  );
  const parametersUnique = parameters.filter(
    (parameter, index) => parameters.indexOf(parameter) === index
  );
  return parametersUnique;
};

export default sensorsSlice.reducer;
