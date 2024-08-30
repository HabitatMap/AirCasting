import React, { useCallback } from "react";
import * as S from "./Navbar.style";
import { useTranslation } from "react-i18next";
import { UrlParamsTypes, useMapParams } from "../../utils/mapParamsHandler";
import { useNavigate } from "react-router-dom";
import useMobileDetection from "../../utils/useScreenSizeDetection";

import { urls } from "../../const/urls";
import { UserSettings } from "../../types/userStates";
import backArrowIcon from "../../assets/icons/backArrowIcon.svg";
import backArrowIconDesktop from "../../assets/icons/backArrowIconDesktop.svg";

const BackToMapButton = () => {
  const { t } = useTranslation();

  const {
    currentUserSettings,
    previousUserSettings,
    searchParams,
    revertUserSettingsAndResetIds,
  } = useMapParams();
  const navigate = useNavigate();
  const isMobile = useMobileDetection();

  const handleGoBackClick = useCallback(() => {
    const newSearchParams = new URLSearchParams(searchParams.toString());
    newSearchParams.set(
      UrlParamsTypes.previousUserSettings,
      currentUserSettings
    );
    newSearchParams.set(
      UrlParamsTypes.currentUserSettings,
      previousUserSettings
    );
    isMobile && newSearchParams.delete(UrlParamsTypes.streamId);
    isMobile && newSearchParams.delete(UrlParamsTypes.sessionId);
    navigate(`${urls.reactMap}?${newSearchParams.toString()}`);
  }, [currentUserSettings, navigate, previousUserSettings, searchParams]);

  const icon = isMobile ? backArrowIcon : backArrowIconDesktop;

  const getButtonText = useCallback(() => {
    switch (previousUserSettings) {
      case UserSettings.SessionListView:
        return t("navbar.goBackToSessions");
      case UserSettings.MapView:
        return t("navbar.goBackToMap");
      case UserSettings.ModalView:
        return t("navbar.goBackToSession");
      default:
        return t("navbar.goBackToMap");
    }
  }, [previousUserSettings, t]);

  return (
    <S.GoBack onClick={handleGoBackClick} aria-label={t("navbar.mapPage")}>
      <img
        src={icon}
        alt={t("navbar.altGoBackIcon")}
        aria-label={t("navbar.goBackToSessions")}
      />
      {getButtonText()}
    </S.GoBack>
  );
};

export { BackToMapButton };
