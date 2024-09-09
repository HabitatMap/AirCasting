import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AxiosResponse } from "axios";
import { oldApiClient } from "../api/apiClient";
import { API_ENDPOINTS } from "../api/apiEndpoints";
import { ApiError, StatusEnum } from "../types/api";
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
  error: ApiError | null;
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
  { rejectValue: ApiError }
>("crowdMap/getCrowdMapData", async (filters: string, { rejectWithValue }) => {
  try {
    const response: AxiosResponse<RectangleData[]> = await oldApiClient.get(
      API_ENDPOINTS.fetchCrowdMap(filters)
    );
    return response.data;
  } catch (error) {
    const message = getErrorMessage(error);

    const apiError: ApiError = {
      message,
      additionalInfo: {
        action: "fetchCrowdMapData",
        endpoint: API_ENDPOINTS.fetchCrowdMap(filters),
      },
    };

    logError(error, apiError);

    return rejectWithValue(apiError);
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
      .addCase(
        fetchCrowdMapData.fulfilled,
        (state, action: PayloadAction<RectangleData[]>) => {
          state.status = StatusEnum.Fulfilled;
          state.rectangles = action.payload;
          state.fetchingData = false;
          state.error = null;
        }
      )
      .addCase(
        fetchCrowdMapData.rejected,
        (state, action: PayloadAction<ApiError | undefined>) => {
          state.status = StatusEnum.Rejected;
          state.error = action.payload || { message: "Unknown error occurred" };
          state.fetchingData = false;
        }
      );
  },
});

export const { clearCrowdMap, setFetchingCrowdMapData } = crowdMapSlice.actions;

export default crowdMapSlice.reducer;

export const selectCrowdMapRectangles = (state: RootState) =>
  state.crowdMap.rectangles;
export const selectFetchingCrowdMapData = (state: RootState) =>
  state.crowdMap.fetchingData;
