import { AxiosResponse } from "axios";
import {
  createAsyncThunk,
  createSelector,
  createSlice,
} from "@reduxjs/toolkit";

import { getErrorMessage } from "../utils/getErrorMessage";
import { apiClient } from "../api/apiClient";
import { API_ENDPOINTS } from "../api/apiEndpoints";
import { Error, StatusEnum } from "../types/api";
import { FixedStream, FixedStreamShortInfo } from "../types/fixedStream";
import { RootState } from ".";
import moment from "moment";

interface FixedStreamState {
  data: FixedStream;
  status: StatusEnum;
  error?: Error;
}

const initialState: FixedStreamState = {
  data: {
    stream: {
      title: "",
      profile: "",
      lastUpdate: "",
      sensorName: "",
      unitSymbol: "",
      updateFrequency: "",
    },
    measurements: [],
    streamDailyAverages: [],
  },
  status: StatusEnum.Idle,
};

export const fetchFixedStreamById = createAsyncThunk<
  FixedStream,
  number,
  { rejectValue: { message: string } }
>("fixedStream/getData", async (id: number, { rejectWithValue }) => {
  try {
    const response: AxiosResponse<FixedStream, Error> = await apiClient.get(
      API_ENDPOINTS.fetchFixedStreamById(id)
    );
    return response.data;
  } catch (error) {
    const message = getErrorMessage(error);
    return rejectWithValue({ message });
  }
});

export const fixedStreamSlice = createSlice({
  name: "fixedStream",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(
      fetchFixedStreamById.fulfilled,
      (state, { payload: { stream, measurements, streamDailyAverages } }) => {
        state.status = StatusEnum.Fulfilled;

        if (stream && measurements && streamDailyAverages) {
          state.data = { stream, measurements, streamDailyAverages };
        }
      }
    );
    builder.addCase(
      fetchFixedStreamById.rejected,
      (state, { error: { message } }) => {
        state.status = StatusEnum.Rejected;
        state.error = { message };
        state.data = initialState.data;
      }
    );
  },
});

const selectFixedStreamData = (state: RootState): FixedStream =>
  state.fixedStream.data;

const selectFixedStreamShortInfo = createSelector(
  [selectFixedStreamData],
  (fixedStreamData) => {
    const { streamDailyAverages } = fixedStreamData;
    const lastMeasurementIndex = streamDailyAverages.length - 1;
    const { value: lastMeasurementValue, date } =
      streamDailyAverages[lastMeasurementIndex] || {};
    const lastMeasurementDateLabel = moment(date).format("MMM D");

    return {
      ...fixedStreamData.stream,
      lastMeasurementValue,
      lastMeasurementDateLabel,
    };
  }
);

export { selectFixedStreamData, selectFixedStreamShortInfo };
export default fixedStreamSlice.reducer;
