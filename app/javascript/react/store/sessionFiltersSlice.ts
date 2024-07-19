import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { RootState } from ".";
import { oldApiClient } from "../api/apiClient";
import { API_ENDPOINTS } from "../api/apiEndpoints";
import { StatusEnum } from "../types/api";
import { getErrorMessage } from "../utils/getErrorMessage";

interface SessionFilterState {
  usernames: string[];
  fetchUsernamesStatus: StatusEnum;
}

const initialState: SessionFilterState = {
  usernames: [],
  fetchUsernamesStatus: StatusEnum.Idle,
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
      });
  },
});

export const selectUsernames = (state: RootState): string[] =>
  state.sessionFilter.usernames;

export default sessionFilterSlice.reducer;
