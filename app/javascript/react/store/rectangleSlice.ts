import { AxiosError, AxiosResponse } from "axios";

import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";

import { oldApiClient } from "../api/apiClient";
import { API_ENDPOINTS } from "../api/apiEndpoints";
import { RootState } from "./";

export interface RectangleData {
  average: number;
  numberOfContributors: number;
  numberOfSamples: number;
}

interface RectangleState {
  data?: RectangleData;
  error: string | null;
  loading: boolean;
}

const initialState: RectangleState = {
  error: null,
  loading: false,
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
    if (error instanceof AxiosError) {
      return rejectWithValue(error.message);
    } else {
      return rejectWithValue("An unknown error occurred");
    }
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
