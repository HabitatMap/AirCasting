import { PayloadAction, createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { AxiosResponse } from "axios";
import { RootState } from ".";
import { oldApiClient } from "../api/apiClient";
import { API_ENDPOINTS } from "../api/apiEndpoints";
import { StatusEnum } from "../types/api";
import { fetchTagsParamsType } from "../types/filters";
import { getErrorMessage } from "../utils/getErrorMessage";

interface SessionFilterState {
  usernames: string[];
  tags: string[];
  fetchUsernamesStatus: StatusEnum;
  fetchTagsStatus: StatusEnum;
  basicParametersModalOpen: boolean;
  customParametersModalOpen: boolean;
  basicSensorsModalOpen: boolean;
  customSensorsModalOpen: boolean;
}

const initialState: SessionFilterState = {
  usernames: [],
  tags: [],
  fetchUsernamesStatus: StatusEnum.Idle,
  fetchTagsStatus: StatusEnum.Idle,
  basicParametersModalOpen: false,
  customParametersModalOpen: false,
  basicSensorsModalOpen: false,
  customSensorsModalOpen: false,
};

export const fetchUsernames = createAsyncThunk(
  "autocomplete/usernames",
  async (username: string, { rejectWithValue }) => {
    try {
      const response: AxiosResponse<string[]> = await oldApiClient.get(
        API_ENDPOINTS.fetchUsernames(username)
      );
      return response.data;
    } catch (error) {
      const message = getErrorMessage(error);
      return rejectWithValue(message);
    }
  }
);

export const fetchTags = createAsyncThunk(
  "autocomplete/tags",
  async (params: fetchTagsParamsType, { rejectWithValue }) => {
    try {
      const response: AxiosResponse<string[]> = await oldApiClient.get(
        API_ENDPOINTS.fetchTags(params)
      );
      return response.data;
    } catch (error) {
      const message = getErrorMessage(error);
      return rejectWithValue(message);
    }
  }
);

const sessionFilterSlice = createSlice({
  name: "sessionFilter",
  initialState,
  reducers: {
    setBasicParametersModalOpen: (state, action: PayloadAction<boolean>) => {
      state.basicParametersModalOpen = action.payload;
    },
    setCustomParametersModalOpen: (state, action: PayloadAction<boolean>) => {
      state.customParametersModalOpen = action.payload;
    },
    setBasicSensorsModalOpen: (state, action: PayloadAction<boolean>) => {
      state.basicSensorsModalOpen = action.payload;
    },
    setCustomSensorsModalOpen: (state, action: PayloadAction<boolean>) => {
      state.customSensorsModalOpen = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsernames.pending, (state) => {
        state.fetchUsernamesStatus = StatusEnum.Pending;
      })
      .addCase(
        fetchUsernames.fulfilled,
        (state, action: PayloadAction<string[]>) => {
          state.fetchUsernamesStatus = StatusEnum.Fulfilled;
          state.usernames = action.payload;
        }
      )
      .addCase(fetchUsernames.rejected, (state) => {
        state.fetchUsernamesStatus = StatusEnum.Rejected;
      })
      .addCase(fetchTags.pending, (state) => {
        state.fetchTagsStatus = StatusEnum.Pending;
      })
      .addCase(
        fetchTags.fulfilled,
        (state, action: PayloadAction<string[]>) => {
          state.fetchTagsStatus = StatusEnum.Fulfilled;
          state.tags = action.payload;
        }
      )
      .addCase(fetchTags.rejected, (state) => {
        state.fetchTagsStatus = StatusEnum.Rejected;
      });
  },
});

export const selectUsernames = (state: RootState): string[] =>
  state.sessionFilter.usernames;

export const selectTags = (state: RootState): string[] =>
  state.sessionFilter.tags;

export const selectBasicParametersModalOpen = (state: RootState): boolean =>
  state.sessionFilter.basicParametersModalOpen;

export const selectCustomParametersModalOpen = (state: RootState): boolean =>
  state.sessionFilter.customParametersModalOpen;

export const selectBasicSensorsModalOpen = (state: RootState): boolean =>
  state.sessionFilter.basicSensorsModalOpen;

export const selectCustomSensorsModalOpen = (state: RootState): boolean =>
  state.sessionFilter.customSensorsModalOpen;

export const {
  setBasicParametersModalOpen,
  setCustomParametersModalOpen,
  setBasicSensorsModalOpen,
  setCustomSensorsModalOpen,
} = sessionFilterSlice.actions;
export default sessionFilterSlice.reducer;
