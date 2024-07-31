import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { AxiosError, AxiosResponse } from "axios";
import { API_ENDPOINTS } from "../api/apiEndpoints";
import { oldApiClient } from "../api/apiClient";

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
}

const initialState: ClusterState = {
  data: null,
  loading: false,
  error: null,
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
    if (error instanceof AxiosError) {
      return rejectWithValue(error.message);
    } else {
      return rejectWithValue("An unknown error occurred");
    }
  }
});

const clusterSlice = createSlice({
  name: "cluster",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchClusterData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchClusterData.fulfilled,
        (state, action: PayloadAction<ClusterData>) => {
          state.data = action.payload;
          state.loading = false;
        }
      )
      .addCase(
        fetchClusterData.rejected,
        (state, action: PayloadAction<string | undefined>) => {
          state.error = action.payload ?? "An unknown error occurred";
          state.loading = false;
        }
      );
  },
});

export default clusterSlice.reducer;
