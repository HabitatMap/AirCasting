import { AxiosError, AxiosResponse } from "axios";

import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";

import { oldApiClient } from "../api/apiClient";
import { API_ENDPOINTS } from "../api/apiEndpoints";

interface RectangleData {
  average: number;
  numberOfContributors: number;
  numberOfSamples: number;
}

interface RectangleState {
  data?: RectangleData;
  error: string | null;
  loading: boolean;
  visible: boolean;
}

const initialState: RectangleState = {
  loading: false,
  error: null,
  visible: false,
};

export const fetchRectangleData = createAsyncThunk<
  RectangleData,
  string, // This can be modified based on what parameters you need
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
    setVisibility: (state, action: PayloadAction<boolean>) => {
      state.visible = action.payload;
    },
    // Additional reducer to clear rectangles if needed
    clearRectangles: (state) => {
      state.data = undefined;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRectangleData.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.visible = true;
      })
      .addCase(
        fetchRectangleData.fulfilled,
        (state, action: PayloadAction<RectangleData>) => {
          state.data = action.payload;
          state.loading = false;
          state.visible = true;
        }
      )
      .addCase(
        fetchRectangleData.rejected,
        (state, action: PayloadAction<string | undefined>) => {
          state.error = action.payload ?? "An unknown error occurred";
          state.loading = false;
          state.visible = false;
        }
      );
  },
});

export const { setVisibility, clearRectangles } = rectangleSlice.actions;

export default rectangleSlice.reducer;
