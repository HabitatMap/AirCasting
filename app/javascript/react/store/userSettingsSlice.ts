import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from ".";
import { UserSettings } from "../types/userStates";

interface UserSettingsState {
  previousUserSettings: UserSettings;
  currentUserSettings: UserSettings;
}

const initialState: UserSettingsState = {
  previousUserSettings: UserSettings.MapView,
  currentUserSettings: UserSettings.MapView,
};

const userSettingsSlice = createSlice({
  name: "userSettings",
  initialState,
  reducers: {
    updateUserSettings: (state, action: PayloadAction<UserSettings>) => {
      state.previousUserSettings = state.currentUserSettings;
      state.currentUserSettings = action.payload;
    },
  },
});

export const { updateUserSettings } = userSettingsSlice.actions;

export default userSettingsSlice.reducer;

export const selectUserSettingsState = (state: RootState): UserSettingsState =>
  state.userSettings;
