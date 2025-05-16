import { useCallback } from "react";
import { selectIsLoading } from "../../../../store";
import { useAppSelector } from "../../../../store/hooks";
import { selectMarkersLoading } from "../../../../store/markersLoadingSlice";
import { setCurrentTimestamp } from "../../../../store/timelapseSlice";
import { UserSettings } from "../../../../types/userStates";

interface UseMapUIProps {
  currentUserSettings: UserSettings;
  previousUserSettings: UserSettings;
  goToUserSettings: (settings: UserSettings) => void;
  dispatch: any;
}

export const useMapUI = ({
  currentUserSettings,
  previousUserSettings,
  goToUserSettings,
  dispatch,
}: UseMapUIProps) => {
  const selectorsLoading = useAppSelector(selectIsLoading);
  const markersLoading = useAppSelector(selectMarkersLoading);

  const openFilters = useCallback(() => {
    goToUserSettings(UserSettings.FiltersView);
  }, [goToUserSettings]);

  const openTimelapse = useCallback(() => {
    // Clear existing timelapse markers before switching views
    dispatch(setCurrentTimestamp(""));

    // Add a small delay to ensure markers are cleared before view changes
    setTimeout(() => {
      goToUserSettings(
        currentUserSettings === UserSettings.TimelapseView
          ? previousUserSettings
          : UserSettings.TimelapseView
      );
    }, 0);
  }, [currentUserSettings, previousUserSettings, goToUserSettings, dispatch]);

  return {
    selectorsLoading,
    markersLoading,
    openFilters,
    openTimelapse,
  };
};
