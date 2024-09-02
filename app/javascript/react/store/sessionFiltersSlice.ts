import {
  PayloadAction,
  createAsyncThunk,
  createSelector,
  createSlice,
} from "@reduxjs/toolkit";
import { AxiosResponse } from "axios";
import { RootState } from ".";
import { oldApiClient } from "../api/apiClient";
import { API_ENDPOINTS } from "../api/apiEndpoints";
import { StatusEnum } from "../types/api";
import { fetchTagsParamsType } from "../types/filters";
import { getErrorMessage } from "../utils/getErrorMessage";

export enum FixedSessionsTypes {
  ACTIVE = "active",
  DORMANT = "dormant",
}
interface SessionFilterState {
  usernames: string[];
  tags: string[];
  fetchUsernamesStatus: StatusEnum;
  fetchTagsStatus: StatusEnum;
  basicParametersModalOpen: boolean;
  customParametersModalOpen: boolean;
  basicSensorsModalOpen: boolean;
  customSensorsModalOpen: boolean;
  fixedSessionsType: FixedSessionsTypes;
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
  fixedSessionsType: FixedSessionsTypes.ACTIVE,
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
    setFixedSessionsType: (
      state,
      action: PayloadAction<FixedSessionsTypes>
    ) => {
      state.fixedSessionsType = action.payload;
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

// Selector to get usernames from the session filter state
export const selectUsernames = createSelector(
  [(state: RootState) => state.sessionFilter.usernames],
  (usernames): string[] => [...usernames] // Return a new array to ensure memoization
);

// Selector to get tags from the session filter state
export const selectTags = createSelector(
  [(state: RootState) => state.sessionFilter.tags],
  (tags): string[] => [...tags] // Return a new array to ensure memoization
);

// Selector to check if the basic parameters modal is open
export const selectBasicParametersModalOpen = createSelector(
  [(state: RootState) => state.sessionFilter.basicParametersModalOpen],
  (basicParametersModalOpen): boolean => basicParametersModalOpen
);

// Selector to check if the custom parameters modal is open
export const selectCustomParametersModalOpen = createSelector(
  [(state: RootState) => state.sessionFilter.customParametersModalOpen],
  (customParametersModalOpen): boolean => customParametersModalOpen
);

// Selector to check if the basic sensors modal is open
export const selectBasicSensorsModalOpen = createSelector(
  [(state: RootState) => state.sessionFilter.basicSensorsModalOpen],
  (basicSensorsModalOpen): boolean => basicSensorsModalOpen
);

// Selector to check if the custom sensors modal is open
export const selectCustomSensorsModalOpen = createSelector(
  [(state: RootState) => state.sessionFilter.customSensorsModalOpen],
  (customSensorsModalOpen): boolean => customSensorsModalOpen
);

// Selector to get the fixed sessions type from the session filter state
export const selectFixedSessionsType = createSelector(
  [(state: RootState) => state.sessionFilter.fixedSessionsType],
  (fixedSessionsType): FixedSessionsTypes => fixedSessionsType
);

// Selector to check if the session type is dormant
export const selectIsDormantSessionsType = createSelector(
  [(state: RootState) => state.sessionFilter.fixedSessionsType],
  (fixedSessionsType): boolean =>
    fixedSessionsType === FixedSessionsTypes.DORMANT
);

export const {
  setBasicParametersModalOpen,
  setCustomParametersModalOpen,
  setBasicSensorsModalOpen,
  setCustomSensorsModalOpen,
  setFixedSessionsType,
} = sessionFilterSlice.actions;
export default sessionFilterSlice.reducer;
