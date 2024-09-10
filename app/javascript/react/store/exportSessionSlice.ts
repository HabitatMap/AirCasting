import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AxiosResponse } from "axios";
import { oldApiClient } from "../api/apiClient";
import { API_ENDPOINTS } from "../api/apiEndpoints";
import { ApiError, StatusEnum } from "../types/api";
import { getErrorMessage } from "../utils/getErrorMessage";
import { logError } from "../utils/logController";

interface ExportSessionState {
  data: {
    sessionsIds: number[];
    email: string;
  };
  status: StatusEnum;
  error: ApiError | null;
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
  { rejectValue: ApiError }
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

    const apiError: ApiError = {
      message,
      additionalInfo: {
        action: "exportSession",
        endpoint: API_ENDPOINTS.exportSessionData(
          sessionData.sessionsIds,
          sessionData.email
        ),
      },
    };

    logError(error, apiError);

    return rejectWithValue(apiError);
  }
});

export const exportSessionSlice = createSlice({
  name: "session",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(
      exportSession.fulfilled,
      (state, action: PayloadAction<SessionData>) => {
        state.status = StatusEnum.Fulfilled;
        state.data = action.payload;
        state.error = null;
      }
    );
    builder.addCase(
      exportSession.rejected,
      (state, action: PayloadAction<ApiError | undefined>) => {
        state.status = StatusEnum.Rejected;
        state.error = action.payload || { message: "Unknown error occurred" };
        state.data = initialState.data;
      }
    );
  },
});

export default exportSessionSlice.reducer;
