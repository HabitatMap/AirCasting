import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { oldApiClient } from "../api/apiClient";
import { AxiosResponse } from "axios";
import { API_ENDPOINTS } from "../api/apiEndpoints";
import { Error, StatusEnum } from "../types/api";

interface ExportSessionState {
  data: {
    average: number;
    number_of_contributors: number;
    number_of_samples: number;
    number_of_instruments: number;
  };
  status: StatusEnum;
  error?: Error;
}

export const initialState: ExportSessionState = {
  data: {
    average: 0,
    number_of_contributors: 0,
    number_of_samples: 0,
    number_of_instruments: 0,
  },
  status: StatusEnum.Idle,
};

interface StreamIds {
  streamIds: string[];
}

export const fetchClusterData = createAsyncThunk<
  ExportSessionState["data"],
  StreamIds,
  { rejectValue: { message: string } }
>("session/fetchSessionData", async (streamIds, { rejectWithValue }) => {
  try {
    const response: AxiosResponse<{
      average: number;
      number_of_contributors: number;
      number_of_samples: number;
      number_of_instruments: number;
    }> = await oldApiClient.get(
      API_ENDPOINTS.fetchClusterData(streamIds.streamIds)
    );
    console.log(response.data);
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message || error.message;
    return rejectWithValue({ message });
  }
});

export const clusterDataSlice = createSlice({
  name: "clusterData",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchClusterData.pending, (state) => {
      state.status = StatusEnum.Pending;
    });
    builder.addCase(fetchClusterData.fulfilled, (state, action) => {
      state.status = StatusEnum.Fulfilled;
      state.data = action.payload;
    });
    builder.addCase(fetchClusterData.rejected, (state, action) => {
      state.status = StatusEnum.Rejected;
      const errorMessage = action.payload?.message;
      state.error = { message: errorMessage || "Unknown error" };
    });
  },
});

export default clusterDataSlice.reducer;
