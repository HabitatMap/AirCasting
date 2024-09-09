import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { AxiosResponse } from "axios";
import { oldApiClient } from "../api/apiClient";
import { API_ENDPOINTS } from "../api/apiEndpoints";
import { StatusEnum } from "../types/api";
import { getErrorMessage } from "../utils/getErrorMessage";
import { logError } from "../utils/logController";

interface ExportSessionState {
  data: {
    sessionsIds: number[];
    email: string;
  };
  status: StatusEnum;
  error: string | null;
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
  error: null,
};

export const exportSession = createAsyncThunk<
  SessionData,
  { sessionsIds: number[]; email: string },
  { rejectValue: string }
>("session/exportSession", async (sessionData, { rejectWithValue }) => {
  try {
    const response: AxiosResponse<SessionData> = await oldApiClient.get(
      API_ENDPOINTS.exportSessionData(
        sessionData.sessionsIds,
        sessionData.email
      )
    );
    return response.data;
  } catch (error) {
    const message = getErrorMessage(error);

    logError(error, {
      action: "exportSession",
      endpoint: API_ENDPOINTS.exportSessionData(
        sessionData.sessionsIds,
        sessionData.email
      ),
      message,
    });

    return rejectWithValue(message);
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
      state.error = null;
    });
    builder.addCase(exportSession.rejected, (state, action) => {
      state.status = StatusEnum.Rejected;
      state.error = action.payload || "Unknown error occurred";
      state.data = initialState.data;
    });
  },
});

export default exportSessionSlice.reducer;
