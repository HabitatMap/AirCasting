import { AxiosResponse } from "axios";

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { oldApiClient } from "../api/apiClient";
import { API_ENDPOINTS } from "../api/apiEndpoints";
import { Error, StatusEnum } from "../types/api";
import { getErrorMessage } from "../utils/getErrorMessage";
import { RootState } from "./";

interface RectangleData {
  value: number;
  west: number;
  east: number;
  south: number;
  north: number;
}

interface CrowdMapState {
  error?: Error;
  rectangles: RectangleData[];
  status: StatusEnum;
}

const initialState: CrowdMapState = {
  rectangles: [],
  status: StatusEnum.Idle,
};

export const fetchCrowdMapData = createAsyncThunk<
  RectangleData[],
  string,
  { rejectValue: { message: string } }
>("crowdMap/getCrowdMapData", async (filters: string, { rejectWithValue }) => {
  try {
    const response: AxiosResponse<RectangleData[], Error> =
      await oldApiClient.get(API_ENDPOINTS.fetchCrowdMap(filters));
    return response.data;
  } catch (error) {
    const message = getErrorMessage(error);
    return rejectWithValue({ message });
  }
});

export const crowdMapSlice = createSlice({
  name: "crowdMap",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCrowdMapData.pending, (state) => {
        state.status = StatusEnum.Pending;
      })
      .addCase(fetchCrowdMapData.fulfilled, (state, { payload }) => {
        state.status = StatusEnum.Fulfilled;
        state.rectangles = payload;
      })
      .addCase(fetchCrowdMapData.rejected, (state, { payload }) => {
        state.status = StatusEnum.Rejected;
        state.error = payload;
      });
  },
});

export default crowdMapSlice.reducer;
export const selectCrowdMapRectangles = (state: RootState) =>
  state.crowdMap.rectangles;
