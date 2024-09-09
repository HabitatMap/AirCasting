import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AxiosResponse } from "axios";
import { oldApiClient } from "../api/apiClient";
import { API_ENDPOINTS } from "../api/apiEndpoints";
import { getErrorMessage } from "../utils/getErrorMessage";
import { logError } from "../utils/logController";
import { RootState } from "./";

export interface RectangleData {
  average: number;
  numberOfContributors: number;
  numberOfSamples: number;
}

interface RectangleState {
  data?: RectangleData;
  error?: string | null;
  loading: boolean;
}

const initialState: RectangleState = {
  loading: false,
  error: null,
};

export const fetchRectangleData = createAsyncThunk<
  RectangleData,
  string,
  { rejectValue: string }
>("rectangle/fetchRectangleData", async (params, { rejectWithValue }) => {
  try {
    const response: AxiosResponse<RectangleData> = await oldApiClient.get(
      API_ENDPOINTS.fetchRectangleData(params)
    );
    return response.data;
  } catch (error) {
    const message = getErrorMessage(error);
    logError(error, {
      action: "fetchRectangleData",
      endpoint: API_ENDPOINTS.fetchRectangleData(params),
      message,
    });
    return rejectWithValue(message);
  }
});

const rectangleSlice = createSlice({
  name: "rectangle",
  initialState,
  reducers: {
    clearRectangles: (state) => {
      state.data = undefined;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRectangleData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchRectangleData.fulfilled,
        (state, action: PayloadAction<RectangleData>) => {
          state.data = action.payload;
          state.loading = false;
          state.error = null;
        }
      )
      .addCase(
        fetchRectangleData.rejected,
        (state, action: PayloadAction<string | undefined>) => {
          state.error = action.payload ?? "An unknown error occurred";
          state.loading = false;
        }
      );
  },
});

export const { clearRectangles } = rectangleSlice.actions;

export default rectangleSlice.reducer;

export const selectRectangleData = (state: RootState) => state.rectangle.data;
export const selectRectangleLoading = (state: RootState) =>
  state.rectangle.loading;
