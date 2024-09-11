import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AxiosResponse } from "axios";
import { oldApiClient } from "../api/apiClient";
import { API_ENDPOINTS } from "../api/apiEndpoints";
import { ApiError, StatusEnum } from "../types/api";
import { MobileStream } from "../types/mobileStream";
import { getErrorMessage } from "../utils/getErrorMessage";
import { logError } from "../utils/logController";

export interface MobileStreamState {
  data: MobileStream;
  status: StatusEnum;
  error: ApiError | null;
  isLoading: boolean;
}

export const initialState: MobileStreamState = {
  data: {
    averageValue: 0,
    endTime: "",
    id: 0,
    maxLatitude: 0,
    maxLongitude: 0,
    measurements: [],
    minLatitude: 0,
    minLongitude: 0,
    notes: [],
    sensorName: "",
    sensorUnit: "",
    startLatitude: 0,
    startLongitude: 0,
    startTime: "",
    streamId: 0,
    title: "",
    username: "",
  },
  status: StatusEnum.Idle,
  error: null,
  isLoading: false,
};

export const fetchMobileStreamById = createAsyncThunk<
  MobileStream,
  number,
  { rejectValue: ApiError }
>("mobileStream/getData", async (id: number, { rejectWithValue }) => {
  try {
    const response: AxiosResponse<MobileStream, Error> = await oldApiClient.get(
      API_ENDPOINTS.fetchMobileStreamById(id)
    );
    return response.data;
  } catch (error) {
    const message = getErrorMessage(error);

    const apiError: ApiError = {
      message,
      additionalInfo: {
        action: "fetchMobileStreamById",
        endpoint: API_ENDPOINTS.fetchMobileStreamById(id),
      },
    };

    logError(error, apiError);

    return rejectWithValue(apiError);
  }
});

export const mobileStreamSlice = createSlice({
  name: "mobileStream",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchMobileStreamById.pending, (state) => {
      state.status = StatusEnum.Pending;
      state.error = null;
      state.isLoading = true;
    });
    builder.addCase(
      fetchMobileStreamById.fulfilled,
      (state, action: PayloadAction<MobileStream>) => {
        state.status = StatusEnum.Fulfilled;
        state.data = action.payload;
        state.error = null;
        state.isLoading = false;
      }
    );
    builder.addCase(
      fetchMobileStreamById.rejected,
      (state, action: PayloadAction<ApiError | undefined>) => {
        state.status = StatusEnum.Rejected;
        state.error = action.payload || { message: "Unknown error occurred" };
        state.data = initialState.data;
        state.isLoading = false;
      }
    );
  },
});

export default mobileStreamSlice.reducer;
