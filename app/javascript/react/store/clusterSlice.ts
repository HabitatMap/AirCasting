import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AxiosResponse } from "axios";
import { oldApiClient } from "../api/apiClient";
import { API_ENDPOINTS } from "../api/apiEndpoints";
import { ApiError } from "../types/api";
import { getErrorMessage } from "../utils/getErrorMessage";
import { logError } from "../utils/logController";

interface ClusterData {
  average: number;
  numberOfContributors: number;
  numberOfSamples: number;
  numberOfInstruments: number;
}

interface ClusterState {
  data: ClusterData | null;
  loading: boolean;
  error: ApiError | null;
  visible: boolean;
}

const initialState: ClusterState = {
  data: null,
  loading: false,
  error: null,
  visible: false,
};

export const fetchClusterData = createAsyncThunk<
  ClusterData,
  string[],
  { rejectValue: ApiError }
>("cluster/fetchClusterData", async (streamIds, { rejectWithValue }) => {
  try {
    const response: AxiosResponse<ClusterData> = await oldApiClient.get(
      API_ENDPOINTS.fetchClusterData(streamIds)
    );
    console.log(response.data, streamIds, "response.data");
    return response.data;
  } catch (error) {
    const errorMessage = getErrorMessage(error);

    const apiError: ApiError = {
      message: errorMessage,
      additionalInfo: {
        action: "fetchClusterData",
        endpoint: API_ENDPOINTS.fetchClusterData(streamIds),
      },
    };

    logError(error, apiError);

    return rejectWithValue(apiError);
  }
});

const clusterSlice = createSlice({
  name: "cluster",
  initialState,
  reducers: {
    setVisibility: (state, action: PayloadAction<boolean>) => {
      state.visible = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchClusterData.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.visible = true;
      })
      .addCase(
        fetchClusterData.fulfilled,
        (state, action: PayloadAction<ClusterData>) => {
          state.data = action.payload;
          state.loading = false;
          state.visible = true;
        }
      )
      .addCase(
        fetchClusterData.rejected,
        (state, action: PayloadAction<ApiError | undefined>) => {
          state.error = action.payload || {
            message: "An unknown error occurred",
          };
          state.loading = false;
          state.visible = false;
        }
      );
  },
});

export const { setVisibility } = clusterSlice.actions;

export default clusterSlice.reducer;
