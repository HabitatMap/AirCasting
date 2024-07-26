import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { RootState } from ".";
import { oldApiClient } from "../api/apiClient";
import { API_ENDPOINTS } from "../api/apiEndpoints";
import { StatusEnum } from "../types/api";
import { getErrorMessage } from "../utils/getErrorMessage";

interface SessionFilterState {
  usernames: string[];
  tags: string[];
  fetchUsernamesStatus: StatusEnum;
  fetchTagsStatus: StatusEnum;
}

const initialState: SessionFilterState = {
  usernames: [],
  tags: [],
  fetchUsernamesStatus: StatusEnum.Idle,
  fetchTagsStatus: StatusEnum.Idle,
};

export const fetchUsernames = createAsyncThunk(
  "autocomplete/usernames",
  async (username: string, { rejectWithValue }) => {
    try {
      const response = await oldApiClient.get(
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
  async (
    queryParams: {
      tag: string;
      west: string;
      east: string;
      south: string;
      north: string;
      timeFrom: string;
      timeTo: string;
      usernames: string | null;
      sensorName: string;
      unitSymbol: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const {
        tag,
        west,
        east,
        south,
        north,
        timeFrom,
        timeTo,
        usernames,
        sensorName,
        unitSymbol,
      } = queryParams;

      const response = await oldApiClient.get(
        API_ENDPOINTS.fetchTags(
          tag,
          west,
          east,
          south,
          north,
          timeFrom,
          timeTo,
          usernames,
          sensorName,
          unitSymbol
        )
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
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsernames.pending, (state) => {
        state.fetchUsernamesStatus = StatusEnum.Pending;
      })
      .addCase(fetchUsernames.fulfilled, (state, action) => {
        state.fetchUsernamesStatus = StatusEnum.Fulfilled;
        state.usernames = action.payload;
      })
      .addCase(fetchUsernames.rejected, (state) => {
        state.fetchUsernamesStatus = StatusEnum.Rejected;
      })
      .addCase(fetchTags.pending, (state) => {
        state.fetchTagsStatus = StatusEnum.Pending;
      })
      .addCase(fetchTags.fulfilled, (state, action) => {
        state.fetchTagsStatus = StatusEnum.Fulfilled;
        state.tags = action.payload;
      })
      .addCase(fetchTags.rejected, (state) => {
        state.fetchTagsStatus = StatusEnum.Rejected;
      });
  },
});

export const selectUsernames = (state: RootState): string[] =>
  state.sessionFilter.usernames;

export const selectTags = (state: RootState): string[] =>
  state.sessionFilter.tags;

export default sessionFilterSlice.reducer;
