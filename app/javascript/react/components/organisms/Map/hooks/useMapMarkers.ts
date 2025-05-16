import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchFixedStreamById,
  resetFixedStreamState,
} from "../../../../store/fixedStreamSlice";
import { useAppDispatch } from "../../../../store/hooks";
import {
  fetchMobileStreamById,
  resetMobileStreamState,
} from "../../../../store/mobileStreamSlice";
import { UserSettings } from "../../../../types/userStates";
import { UrlParamsTypes } from "../../../../utils/mapParamsHandler";

interface UseMapMarkersProps {
  currentUserSettings: UserSettings;
  previousUserSettings: UserSettings;
  fixedSessionTypeSelected: boolean;
  isMobile: boolean;
  searchParams: URLSearchParams;
  navigate: ReturnType<typeof useNavigate>;
  revertUserSettingsAndResetIds: () => void;
}

export const useMapMarkers = ({
  currentUserSettings,
  previousUserSettings,
  fixedSessionTypeSelected,
  isMobile,
  searchParams,
  navigate,
  revertUserSettingsAndResetIds,
}: UseMapMarkersProps) => {
  const dispatch = useAppDispatch();
  const [pulsatingSessionId, setPulsatingSessionId] = useState<number | null>(
    null
  );

  const handleMarkerClick = (
    selectedStreamId: number | null,
    id: number | null
  ) => {
    if (currentUserSettings !== UserSettings.SessionListView) {
      setPreviousZoomInTheURL();
    }

    if (selectedStreamId) {
      fixedSessionTypeSelected
        ? dispatch(fetchFixedStreamById(selectedStreamId))
        : dispatch(fetchMobileStreamById(selectedStreamId));
    }

    if (isMobile && fixedSessionTypeSelected) {
      const newSearchParams = new URLSearchParams(searchParams.toString());
      newSearchParams.set(
        UrlParamsTypes.previousUserSettings,
        currentUserSettings
      );
      newSearchParams.set(
        UrlParamsTypes.currentUserSettings,
        UserSettings.CalendarView
      );
      newSearchParams.set(UrlParamsTypes.sessionId, id?.toString() || "");
      newSearchParams.set(
        UrlParamsTypes.streamId,
        selectedStreamId?.toString() || ""
      );

      navigate(`/fixed_stream?${newSearchParams.toString()}`, {
        replace: true,
      });
      return;
    }

    const newSearchParams = new URLSearchParams(searchParams.toString());
    newSearchParams.set(UrlParamsTypes.sessionId, id?.toString() || "");
    newSearchParams.set(
      UrlParamsTypes.streamId,
      selectedStreamId?.toString() || ""
    );
    newSearchParams.set(
      UrlParamsTypes.previousUserSettings,
      currentUserSettings
    );
    newSearchParams.set(
      UrlParamsTypes.currentUserSettings,
      UserSettings.ModalView
    );

    navigate(`?${newSearchParams.toString()}`);

    if (!selectedStreamId) {
      revertUserSettingsAndResetIds();
      fixedSessionTypeSelected
        ? dispatch(resetFixedStreamState())
        : dispatch(resetMobileStreamState());
    }
  };

  const setPreviousZoomInTheURL = () => {
    const desktopCondition: boolean =
      !isMobile &&
      currentUserSettings !== UserSettings.ModalView &&
      previousUserSettings !== UserSettings.CalendarView;
    const mobileCondition: boolean =
      isMobile && currentUserSettings === UserSettings.MapView;
    const mobileConditionForSessionList: boolean =
      isMobile &&
      currentUserSettings === UserSettings.SessionListView &&
      previousUserSettings === UserSettings.MapView;

    if (desktopCondition || mobileCondition || mobileConditionForSessionList) {
      const newSearchParams = new URLSearchParams(searchParams.toString());
      navigate(`?${newSearchParams.toString()}`);
    }
  };

  return {
    pulsatingSessionId,
    setPulsatingSessionId,
    handleMarkerClick,
  };
};
