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
  basicPrametersModalOpen: boolean;
}

const initialState: SessionFilterState = {
  usernames: [],
  tags: [],
  fetchUsernamesStatus: StatusEnum.Idle,
  fetchTagsStatus: StatusEnum.Idle,
  basicPrametersModalOpen: false,
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
    setBasicPrametersModalOpen: (state, action: PayloadAction<boolean>) => {
      state.basicPrametersModalOpen = action.payload;
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
  state.sessionFilter.basicPrametersModalOpen;

export const { setBasicPrametersModalOpen } = sessionFilterSlice.actions;
export default sessionFilterSlice.reducer;
