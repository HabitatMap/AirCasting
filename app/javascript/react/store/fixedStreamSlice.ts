import { AxiosResponse } from "axios";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { getErrorMessage } from "../utils/getErrorMessage";
import { apiClient } from "../api/apiClient";
import { API_ENDPOINTS } from "../api/apiEndpoints";
import { Error, StatusEnum } from "../types/api";
import { FixedStream } from "../types/fixedStream";
import type { RootState } from "./index";

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
      active: true,
      sessionId: "",
    },
    measurements: [],
    streamDailyAverages: [],
  },
  status: StatusEnum.Idle,
};

const dumpData: FixedStreamState = {
  data: {
    stream: {
      title: "",
      profile: "",
      lastUpdate: "",
      sensorName: "",
      unitSymbol: "",
      updateFrequency: "",
      active: false,
    },
    measurements: [],
    streamDailyAverages: [{ date: "2024-05-10", value: 1 }],
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
        state.data = dumpData.data;
      }
    );
    builder.addCase(
      fetchFixedStreamById.rejected,
      (state, { error: { message } }) => {
        state.status = StatusEnum.Rejected;
        state.error = { message };
        state.data = dumpData.data;
      }
    );
  },
});

export default fixedStreamSlice.reducer;
export const selectFixedData = (state: RootState) => state.fixedStream.data;
