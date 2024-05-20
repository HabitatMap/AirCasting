import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { exportSessionApiClient } from "../api/apiClient";
import { AxiosResponse } from "axios";
import { API_ENDPOINTS } from "../api/apiEndpoints";
import { Error, StatusEnum } from "../types/api";

interface ExportSessionState {
  data: {
    sessionId: string;
    email: string;
  };
  status: StatusEnum;
  error?: Error;
}

export interface SessionData  {
  sessionId: "",
  email: "",
};

const initialState: ExportSessionState = {
  data: {
    sessionId: "",
    email: "",
  },
  status: StatusEnum.Idle,
};
export const exportSession = createAsyncThunk<
  SessionData,
  { sessionId: string; email: string },
  { rejectValue: { message: string } }
>('session/exportSession', async (sessionData, { rejectWithValue }) => {
  try {
    const response: AxiosResponse<SessionData, Error> = await exportSessionApiClient.get(
      API_ENDPOINTS.exportSessionData(sessionData.sessionId, sessionData.email)
    );
    console.log(response.data);
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
      console.log(state.status)
      state.status = StatusEnum.Fulfilled;
      console.log(state.status)
      state.data = action.payload;
    });
    builder.addCase(exportSession.rejected, (state, action) => {
      state.status = StatusEnum.Rejected;
      if (action.payload) {
        state.error = { message: action.payload.message };
      } else {
        state.error = { message: action.error.message || 'Unknown error' };
      }
      state.data = initialState.data;
    });
  },
});

export default exportSessionSlice.reducer;
