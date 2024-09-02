import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

import { UrlParamsTypes, useMapParams } from "../utils/mapParamsHandler";
import useMobileDetection from "../utils/useScreenSizeDetection";
import { urls } from "../const/urls";

const useCalendarBackNavigation = () => {
  const navigate = useNavigate();
  const isMobile = useMobileDetection();

  const { currentUserSettings, previousUserSettings, searchParams } =
    useMapParams();

  const handleCalendarGoBack = useCallback(() => {
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
