import React, { useCallback } from "react";
import { useNavigate } from "react-router-dom";

import airCastingLogoMobile from "../../assets/icons/airCastingLogoMobile.svg";
import backArrowIcon from "../../assets/icons/backArrowIcon.svg";
import hamburgerMobile from "../../assets/icons/hamburgerMobile.svg";
import { urls } from "../../const/urls";
import { UserSettings } from "../../types/userStates";
import { UrlParamsTypes, useMapParams } from "../../utils/mapParamsHandler";
import { LocationSearch } from "../LocationSearch";
import { ControlPanel } from "../Map/ControlPanel/ControlPanel";
import { RefreshMapButton } from "../RefreshMapButton";
import * as S from "./Navbar.style";
import NavList from "./NavList/NavList";

export const MobileHeader = ({
  toggleMenuVisibility,
  navMenuVisible,
  t,
}: {
  toggleMenuVisibility: () => void;
  navMenuVisible: boolean;
  t: (key: string) => string;
}) => {
  const { currentUserSettings, previousUserSettings, searchParams } =
    useMapParams();
  const navigate = useNavigate();

  const handleGoBackClick = useCallback(() => {
    const newSearchParams = new URLSearchParams(searchParams.toString());
    newSearchParams.set(UrlParamsTypes.sessionId, "");
    newSearchParams.set(UrlParamsTypes.streamId, "");
    newSearchParams.set(
      UrlParamsTypes.previousUserSettings,
      currentUserSettings
    );
    newSearchParams.set(
      UrlParamsTypes.currentUserSettings,
      previousUserSettings
    );
    navigate(`?${newSearchParams.toString()}`);
  }, [currentUserSettings, navigate, previousUserSettings, searchParams]);

  return (
    <S.MobileHeaderContainer>
      {currentUserSettings === UserSettings.ModalView ? (
        <S.GoBack onClick={handleGoBackClick} aria-label={t("navbar.mapPage")}>
          <img
            src={backArrowIcon}
            alt={t("navbar.altGoBackIcon")}
            aria-label={t("navbar.goBackToSessions")}
          />
          {previousUserSettings === UserSettings.SessionListView
            ? t("navbar.goBackToSessions")
            : t("navbar.goBackToMap")}
        </S.GoBack>
      ) : (
        <>
          <S.MobileMenuContainer>
            <a
              href={urls.habitatMap}
              aria-label={t("navbar.sections.aircastingPage")}
            >
              <img alt={t("navbar.altLogo")} src={airCastingLogoMobile} />
            </a>
            <nav>
              <S.MenuButton onClick={toggleMenuVisibility}>
                <img
                  src={hamburgerMobile}
                  alt={t("navbar.altMenu")}
                  aria-label={t("navbar.sections.openMenu")}
                />
              </S.MenuButton>
            </nav>
          </S.MobileMenuContainer>
          <LocationSearch isMapPage={true} />
          <RefreshMapButton />
          <ControlPanel />
          {navMenuVisible && (
            <NavList
              t={t as (key: string) => string}
              navMenuVisible={navMenuVisible}
              toggleMenuVisibility={toggleMenuVisibility}
            />
          )}
        </>
      )}
    </S.MobileHeaderContainer>
  );
};

export const MobileCalendarHeader = ({ t }: { t: Function }) => {
  const { currentUserSettings, previousUserSettings, searchParams } =
    useMapParams();
  const navigate = useNavigate();

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
    navigate(`${urls.reactMap}?${newSearchParams.toString()}`);
  }, [currentUserSettings, navigate, previousUserSettings, searchParams]);

  return (
    <S.MobileContainer>
      <S.GoBack onClick={handleGoBackClick} aria-label={t("navbar.mapPage")}>
        <img
          src={backArrowIcon}
          alt={t("navbar.altGoBackIcon")}
          aria-label={t("navbar.goBackToSessions")}
        />
        {previousUserSettings === UserSettings.SessionListView
          ? t("navbar.goBackToSessions")
          : t("navbar.goBackToMap")}
      </S.GoBack>
    </S.MobileContainer>
  );
};
