import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { AxiosResponse } from "axios";
import { oldApiClient } from "../api/apiClient";
import { API_ENDPOINTS } from "../api/apiEndpoints";
import { Error, StatusEnum } from "../types/api";

interface ExportSessionState {
  data: {
    sessionsIds: number[];
    email: string;
  };
  status: StatusEnum;
  error?: Error;
}

export interface SessionData {
  sessionsIds: number[];
  email: string;
}

const initialState: ExportSessionState = {
  data: {
    sessionsIds: [],
    email: "",
  },
  status: StatusEnum.Idle,
};

export const exportSession = createAsyncThunk<
  SessionData,
  { sessionsIds: number[]; email: string },
  { rejectValue: { message: string } }
>("session/exportSession", async (sessionData, { rejectWithValue }) => {
  try {
    const response: AxiosResponse<SessionData, Error> = await oldApiClient.get(
      API_ENDPOINTS.exportSessionData(
        sessionData.sessionsIds,
        sessionData.email
      )
    );

    return response.data;
  } catch (error: Error | any) {
    const message = error.response?.data?.message || error.message;
    return rejectWithValue({ message });
  }
});

export const exportSessionSlice = createSlice({
  name: "session",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(exportSession.fulfilled, (state, action) => {
      state.status = StatusEnum.Fulfilled;
      state.data = action.payload;
    });
    builder.addCase(exportSession.rejected, (state, action) => {
      state.status = StatusEnum.Rejected;
      const errorMessage = action.payload?.message;
      state.error = { message: errorMessage || "Unknown error" };
      state.data = initialState.data;
    });
  },
});

export default exportSessionSlice.reducer;
