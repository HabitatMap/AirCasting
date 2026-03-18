import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AxiosResponse } from "axios";
import { apiClient, oldApiClient } from "../api/apiClient";
import { API_ENDPOINTS } from "../api/apiEndpoints";
import { SensorPrefix } from "../types/sensors";
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
  { sessionsIds: number[]; email: string; sensorName?: string; stationStreamId?: number },
  { rejectValue: ApiError }
>("session/exportSession", async (sessionData, { rejectWithValue }) => {
  const isGovernment = sessionData.sensorName
    ?.toLowerCase()
    .startsWith(SensorPrefix.GOVERNMENT.toLowerCase());

  try {
    if (isGovernment && sessionData.stationStreamId !== undefined) {
      const endpoint = API_ENDPOINTS.exportStationStreamData(
        sessionData.stationStreamId,
        sessionData.email
      );
      await apiClient.get(endpoint);
    } else {
      const endpoint = API_ENDPOINTS.exportSessionData(
        sessionData.sessionsIds,
        sessionData.email
      );
      await oldApiClient.get(endpoint);
    }
    return { sessionsIds: sessionData.sessionsIds, email: sessionData.email };
  } catch (error) {
    const message = getErrorMessage(error);

    const apiError: ApiError = {
      message,
      additionalInfo: {
        action: "exportSession",
        endpoint: isGovernment && sessionData.stationStreamId !== undefined
          ? API_ENDPOINTS.exportStationStreamData(sessionData.stationStreamId, sessionData.email)
          : API_ENDPOINTS.exportSessionData(
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
