import { AxiosResponse } from "axios";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { apiClient } from "../api/apiClient";
import { API_ENDPOINTS } from "../api/apiEndpoints";
import { Error, StatusEnum } from "../types/api";
import { FixedStream } from "../types/fixedStream";
import { RootState } from ".";

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

export const getFixedStreamData = createAsyncThunk(
  "fixedStream/getData",
  async (id: number, { rejectWithValue }) => {
    try {
      const response = (await apiClient.get(
        API_ENDPOINTS.getFixedStream(id),
        undefined
      )) as AxiosResponse<FixedStream>;
      return response.data;
    } catch (error) {
      console.log(error);

      return rejectWithValue(error);
    }
  }
);

export const fixedStreamSlice = createSlice({
  name: "fixedStream",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(getFixedStreamData.fulfilled, (state, { payload }) => {
      state.status = StatusEnum.Fulfilled;

      if (payload) {
        state.data = { ...payload };
      }
    });
    builder.addCase(getFixedStreamData.rejected, (state, { error }) => {
      state.status = StatusEnum.Rejected;
      state.error = { message: error.message, code: error.code };
      state.data = initialState.data;
    });
  },
});

export const selectFixedStreamData = (state: RootState): FixedStream => {
  return state.fixedStream.data;
};

export default fixedStreamSlice.reducer;
