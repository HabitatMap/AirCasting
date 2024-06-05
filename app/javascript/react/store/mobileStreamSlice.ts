import { AxiosResponse } from "axios";

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { oldApiClient } from "../api/apiClient";
import { API_ENDPOINTS } from "../api/apiEndpoints";
import { Error, StatusEnum } from "../types/api";
import { MobileStream } from "../types/mobileStream";
import { getErrorMessage } from "../utils/getErrorMessage";

interface MobileStreamState {
  data: MobileStream;
  status: StatusEnum;
  error?: Error;
}

const initialState: MobileStreamState = {
  data: {
    averageValue: 0,
    endTime: 0,
    id: 0,
    maxLatitude: 0,
    maxLongitude: 0,
    measurements: [],
    minLatitude: 0,
    minLongitude: 0,
    notes: [],
    sensorName: "",
    sensorUnit: "",
    startLatitude: 0,
    startLongitude: 0,
    startTime: 0,
    streamId: 0,
    title: "",
    username: "",
  },
  status: StatusEnum.Idle,
};

export const fetchMobileStreamById = createAsyncThunk<
  MobileStream,
  number,
  { rejectValue: { message: string } }
>("mobileStream/getData", async (id: number, { rejectWithValue }) => {
  try {
    const response: AxiosResponse<MobileStream, Error> = await oldApiClient.get(
      API_ENDPOINTS.fetchMobileStreamById(id)
    );
    return response.data;
  } catch (error) {
    const message = getErrorMessage(error);
    return rejectWithValue({ message });
  }
});

export const mobileStreamSlice = createSlice({
  name: "mobileStream",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchMobileStreamById.fulfilled, (state, action) => {
      state.status = StatusEnum.Fulfilled;
      state.data = action.payload;
    });
    builder.addCase(
      fetchMobileStreamById.rejected,
      (state, { error: { message } }) => {
        state.status = StatusEnum.Rejected;
        state.error = { message };
        state.data = initialState.data;
      }
    );
  },
});

export default mobileStreamSlice.reducer;
