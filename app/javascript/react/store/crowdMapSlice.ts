import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AxiosResponse } from "axios";
import { oldApiClient } from "../api/apiClient";
import { API_ENDPOINTS } from "../api/apiEndpoints";
import { StatusEnum } from "../types/api";
import { getErrorMessage } from "../utils/getErrorMessage";
import { logError } from "../utils/logController";
import { RootState } from "./";

interface RectangleData {
  value: number;
  west: number;
  east: number;
  south: number;
  north: number;
}

interface CrowdMapState {
  error: string | null;
  fetchingData: boolean;
  rectangles: RectangleData[];
  status: StatusEnum;
}

const initialState: CrowdMapState = {
  fetchingData: true,
  rectangles: [],
  status: StatusEnum.Idle,
  error: null,
};

export const fetchCrowdMapData = createAsyncThunk<
  RectangleData[],
  string,
  { rejectValue: string }
>("crowdMap/getCrowdMapData", async (filters: string, { rejectWithValue }) => {
  try {
    const response: AxiosResponse<RectangleData[]> = await oldApiClient.get(
      API_ENDPOINTS.fetchCrowdMap(filters)
    );
    return response.data;
  } catch (error) {
    const message = getErrorMessage(error);

    logError(error, {
      action: "fetchCrowdMapData",
      endpoint: API_ENDPOINTS.fetchCrowdMap(filters),
      message,
    });

    return rejectWithValue(message);
  }
});

const crowdMapSlice = createSlice({
  name: "crowdMap",
  initialState,
  reducers: {
    clearCrowdMap: (state) => {
      state.rectangles = [];
    },
    setFetchingCrowdMapData(state, action: PayloadAction<boolean>) {
      state.fetchingData = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCrowdMapData.pending, (state) => {
        state.status = StatusEnum.Pending;
        state.error = null;
      })
      .addCase(fetchCrowdMapData.fulfilled, (state, { payload }) => {
        state.status = StatusEnum.Fulfilled;
        state.rectangles = payload;
        state.fetchingData = false;
      })
      .addCase(fetchCrowdMapData.rejected, (state, { payload }) => {
        state.status = StatusEnum.Rejected;
        state.error = payload || "Unknown error occurred";
        state.fetchingData = false;
      });
  },
});

export const { clearCrowdMap, setFetchingCrowdMapData } = crowdMapSlice.actions;

export default crowdMapSlice.reducer;

export const selectCrowdMapRectangles = (state: RootState) =>
  state.crowdMap.rectangles;
export const selectFetchingCrowdMapData = (state: RootState) =>
  state.crowdMap.fetchingData;
