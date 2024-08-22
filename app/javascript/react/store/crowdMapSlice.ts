import { AxiosResponse } from "axios";

import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";

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
  fetchingData: boolean;
  rectangles: RectangleData[];
  status: StatusEnum;
}

const initialState: CrowdMapState = {
  fetchingData: true,
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
  reducers: {
    setFetchingCrowdMapData(state, action: PayloadAction<boolean>) {
      state.fetchingData = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCrowdMapData.pending, (state) => {
        state.status = StatusEnum.Pending;
      })
      .addCase(fetchCrowdMapData.fulfilled, (state, { payload }) => {
        state.status = StatusEnum.Fulfilled;
        state.rectangles = payload;
        state.fetchingData = false;
      })
      .addCase(fetchCrowdMapData.rejected, (state, { payload }) => {
        state.status = StatusEnum.Rejected;
        state.error = payload;
        state.fetchingData = false;
      });
  },
});

export const { setFetchingCrowdMapData } = crowdMapSlice.actions;

export default crowdMapSlice.reducer;

export const selectCrowdMapRectangles = (state: RootState) =>
  state.crowdMap.rectangles;
export const selectFetchingCrowdMapData = (state: RootState) =>
  state.crowdMap.fetchingData;
