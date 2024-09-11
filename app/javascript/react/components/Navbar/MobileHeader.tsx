import React from "react";

import airCastingLogoMobile from "../../assets/icons/airCastingLogoMobile.svg";
import backArrowIcon from "../../assets/icons/backArrowIcon.svg";
import hamburgerMobile from "../../assets/icons/hamburgerMobile.svg";

import { urls } from "../../const/urls";
import { UserSettings } from "../../types/userStates";
import { useMapParams } from "../../utils/mapParamsHandler";
import { LocationSearch } from "../LocationSearch";
import { ControlPanel } from "../Map/ControlPanel/ControlPanel";
import { RealtimeMapUpdatesButton } from "../RealtimeMapUpdatesButton/RealtimeMapUpdatesButton";
import { RefreshMapButton } from "../RefreshMapButton";
import { BackButton } from "./BackButton";
import * as S from "./Navbar.style";
import NavList from "./NavList/NavList";

export const MobileHeader = ({
  isTimelapseView,
  toggleMenuVisibility,
  navMenuVisible,
  t,
}: {
  isTimelapseView: boolean;
  toggleMenuVisibility: () => void;
  navMenuVisible: boolean;
  t: (key: string) => string;
}) => {
  const {
    currentUserSettings,
    previousUserSettings,
    revertUserSettingsAndResetIds,
  } = useMapParams();

  return (
    <S.MobileHeaderContainer>
      {currentUserSettings === UserSettings.ModalView ? (
        <S.GoBack
          onClick={() => revertUserSettingsAndResetIds()}
          aria-label={t("navbar.mapPage")}
        >
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
          <S.MobileMenuContainer className="active-overlay">
            <a
              href={urls.aircasting}
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
          <LocationSearch isMapPage={true} isTimelapseView={isTimelapseView} />
          {!isTimelapseView && (
            <>
              <RefreshMapButton />
              <ControlPanel />
              <RealtimeMapUpdatesButton />
            </>
          )}
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
  return (
    <S.MobileContainer>
      <BackButton />
    </S.MobileContainer>
  );
};
