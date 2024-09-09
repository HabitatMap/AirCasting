import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { AxiosError, AxiosResponse } from "axios";
import { API_ENDPOINTS } from "../api/apiEndpoints";
import { oldApiClient } from "../api/apiClient";
import { logError } from "../utils/logController";
import { getErrorMessage } from "../utils/getErrorMessage"; // Assuming this is where the utility is located

interface ClusterData {
  average: number;
  numberOfContributors: number;
  numberOfSamples: number;
  numberOfInstruments: number;
}

interface ClusterState {
  data: ClusterData | null;
  loading: boolean;
  error: string | null;
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
  { rejectValue: string }
>("cluster/fetchClusterData", async (streamIds, { rejectWithValue }) => {
  try {
    const response: AxiosResponse<ClusterData> = await oldApiClient.get(
      API_ENDPOINTS.fetchClusterData(streamIds)
    );
    return response.data;
  } catch (error) {
    const errorMessage = getErrorMessage(error);

    logError(error, {
      action: "fetchClusterData",
      endpoint: API_ENDPOINTS.fetchClusterData(streamIds),
      message: errorMessage,
    });

    return rejectWithValue(errorMessage);
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
        (state, action: PayloadAction<string | undefined>) => {
          state.error = action.payload || "An unknown error occurred";
          state.loading = false;
          state.visible = false;
        }
      );
  },
});

export const { setVisibility } = clusterSlice.actions;

export default clusterSlice.reducer;
