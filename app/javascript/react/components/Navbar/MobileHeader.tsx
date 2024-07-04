import React from "react";

import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import airCastingLogoMobile from "../../assets/icons/airCastingLogoMobile.svg";
import backArrowIcon from "../../assets/icons/backArrowIcon.svg";
import hamburgerMobile from "../../assets/icons/hamburgerMobile.svg";
import { urls } from "../../const/urls";
import { RootState } from "../../store";
import { LocationSearch } from "../LocationSearch";
import { ControlPanel } from "../Map/ControlPanel/ControlPanel";
import { RefreshMapButton } from "../RefreshMapButton";
import NavList from "./NavList/NavList";
import * as S from "./Navbar.style";

export const MobileHeader = ({
  toggleMenuVisibility,
  navMenuVisible,
  t,
}: {
  toggleMenuVisibility: () => void;
  navMenuVisible: boolean;
  t: Function;
}) => (
  <S.MobileHeaderContainer>
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
  </S.MobileHeaderContainer>
);

export const MobileCalendarHeader = ({ t }: { t: Function }) => {
  const navigate = useNavigate();
  const sessionsListOpen = useSelector(
    (state: RootState) => state.map.sessionsListOpen
  );

  return (
    <S.MobileContainer>
      <S.GoBack
        onClick={() => {
          navigate(urls.reactMap);
        }}
        aria-label={t("navbar.mapPage")}
      >
        <img
          src={backArrowIcon}
          alt={t("navbar.altGoBackIcon")}
          aria-label={t("navbar.goBackToSessions")}
        />
        {sessionsListOpen ? t("navbar.goBackToSessions") : t("navbar.goBack")}
      </S.GoBack>
    </S.MobileContainer>
  );
};
