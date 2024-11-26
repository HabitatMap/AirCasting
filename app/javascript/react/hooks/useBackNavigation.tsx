import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

import { urls } from "../const/urls";
import { useAppDispatch } from "../store/hooks";
import { resetMovingStreamData } from "../store/movingCalendarStreamSlice";
import { UserSettings } from "../types/userStates";
import { UrlParamsTypes, useMapParams } from "../utils/mapParamsHandler";
import useMobileDetection from "../utils/useScreenSizeDetection";

const useCalendarBackNavigation = () => {
  const navigate = useNavigate();
  const isMobile = useMobileDetection();
  const dispatch = useAppDispatch();

  const { currentUserSettings, previousUserSettings, searchParams } =
    useMapParams();

  const handleCalendarGoBack = useCallback(() => {
    if (currentUserSettings === UserSettings.CalendarView) {
      dispatch(resetMovingStreamData());
    }
    const newSearchParams = new URLSearchParams(searchParams.toString());
    newSearchParams.set(
      UrlParamsTypes.previousUserSettings,
      currentUserSettings
    );
    newSearchParams.set(
      UrlParamsTypes.currentUserSettings,
      previousUserSettings
    );
    if (isMobile) {
      newSearchParams.delete(UrlParamsTypes.streamId);
      newSearchParams.delete(UrlParamsTypes.sessionId);
    }
    navigate(`${urls.reactMap}?${newSearchParams.toString()}`);
  }, [
    currentUserSettings,
    navigate,
    previousUserSettings,
    searchParams,
    isMobile,
  ]);

  return handleCalendarGoBack;
};

export { useCalendarBackNavigation };
