import { PayloadAction, createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { AxiosResponse } from "axios";
import { RootState } from ".";
import { oldApiClient } from "../api/apiClient";
import { API_ENDPOINTS } from "../api/apiEndpoints";
import { ApiError, StatusEnum } from "../types/api";
import { fetchTagsParamsType } from "../types/filters";
import { getErrorMessage } from "../utils/getErrorMessage";
import { logError } from "../utils/logController";

export enum FixedSessionsTypes {
  ACTIVE = "active",
  DORMANT = "dormant",
}

interface SessionFilterState {
  usernames: string[];
  tags: string[];
  fetchUsernamesStatus: StatusEnum;
  fetchTagsStatus: StatusEnum;
  usernamesError: ApiError | null;
  tagsError: ApiError | null;
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
  usernamesError: null,
  tagsError: null,
  basicParametersModalOpen: false,
  customParametersModalOpen: false,
  basicSensorsModalOpen: false,
  customSensorsModalOpen: false,
  fixedSessionsType: FixedSessionsTypes.ACTIVE,
};

export const fetchUsernames = createAsyncThunk<
  string[],
  string,
  { rejectValue: ApiError }
>("autocomplete/usernames", async (username, { rejectWithValue }) => {
  try {
    const response: AxiosResponse<string[]> = await oldApiClient.get(
      API_ENDPOINTS.fetchUsernames(username)
    );
    return response.data;
  } catch (error) {
    const message = getErrorMessage(error);

    const apiError: ApiError = {
      message,
      additionalInfo: {
        action: "fetchUsernames",
        endpoint: API_ENDPOINTS.fetchUsernames(username),
      },
    };

    logError(error, apiError);

    return rejectWithValue(apiError);
  }
});

export const fetchTags = createAsyncThunk<
  string[],
  fetchTagsParamsType,
  { rejectValue: ApiError }
>("autocomplete/tags", async (params, { rejectWithValue }) => {
  try {
    const response: AxiosResponse<string[]> = await oldApiClient.get(
      API_ENDPOINTS.fetchTags(params)
    );
    return response.data;
  } catch (error) {
    const message = getErrorMessage(error);

    const apiError: ApiError = {
      message,
      additionalInfo: {
        action: "fetchTags",
        endpoint: API_ENDPOINTS.fetchTags(params),
      },
    };

    logError(error, apiError);

    return rejectWithValue(apiError);
  }
});

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
        state.usernamesError = null;
      })
      .addCase(
        fetchUsernames.fulfilled,
        (state, action: PayloadAction<string[]>) => {
          state.fetchUsernamesStatus = StatusEnum.Fulfilled;
          state.usernames = action.payload;
          state.usernamesError = null;
        }
      )
      .addCase(
        fetchUsernames.rejected,
        (state, action: PayloadAction<ApiError | undefined>) => {
          state.fetchUsernamesStatus = StatusEnum.Rejected;
          state.usernames = [];
          state.usernamesError = action.payload || {
            message: "Unknown error occurred",
          };
        }
      )
      .addCase(fetchTags.pending, (state) => {
        state.fetchTagsStatus = StatusEnum.Pending;
        state.tagsError = null;
      })
      .addCase(
        fetchTags.fulfilled,
        (state, action: PayloadAction<string[]>) => {
          state.fetchTagsStatus = StatusEnum.Fulfilled;
          state.tags = action.payload;
          state.tagsError = null;
        }
      )
      .addCase(
        fetchTags.rejected,
        (state, action: PayloadAction<ApiError | undefined>) => {
          state.fetchTagsStatus = StatusEnum.Rejected;
          state.tags = [];
          state.tagsError = action.payload || {
            message: "Unknown error occurred",
          };
        }
      );
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

export const selectFixedSessionsType = (state: RootState): FixedSessionsTypes =>
  state.sessionFilter.fixedSessionsType;

export const selectIsDormantSessionsType = (state: RootState): boolean =>
  state.sessionFilter.fixedSessionsType === FixedSessionsTypes.DORMANT;

export const {
  setBasicParametersModalOpen,
  setCustomParametersModalOpen,
  setBasicSensorsModalOpen,
  setCustomSensorsModalOpen,
  setFixedSessionsType,
} = sessionFilterSlice.actions;
export default sessionFilterSlice.reducer;
