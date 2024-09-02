import React, { useCallback } from "react";
import * as S from "./Navbar.style";
import { useTranslation } from "react-i18next";

import { useMapParams } from "../../utils/mapParamsHandler";
import useMobileDetection from "../../utils/useScreenSizeDetection";
import { useCalendarBackNavigation } from "../../hooks/useBackNavigation";

import { UserSettings } from "../../types/userStates";

import backArrowIcon from "../../assets/icons/backArrowIcon.svg";
import backArrowIconDesktop from "../../assets/icons/backArrowIconDesktop.svg";

const BackButton = () => {
  const { t } = useTranslation();
  const handleCalendarGoBack = useCalendarBackNavigation();

  const { previousUserSettings } = useMapParams();

  const isMobile = useMobileDetection();

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
    <S.GoBack onClick={handleCalendarGoBack} aria-label={t("navbar.mapPage")}>
      <img
        src={icon}
        alt={t("navbar.altGoBackIcon")}
        aria-label={t("navbar.goBackToSessions")}
      />
      {getButtonText()}
    </S.GoBack>
  );
};

export { BackButton };
