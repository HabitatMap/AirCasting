import React from "react";

import airCastingLogoMobile from "../../assets/icons/airCastingLogoMobile.svg";
import goBackIcon from "../../assets/icons/goBackIcon.svg";
import hamburgerMobile from "../../assets/icons/hamburgerMobile.svg";
import { urls } from "../../const/urls";
import { Map } from "../../types/googleMaps";
import { LocationSearch } from "../LocationSearch";
import { ControlPanel } from "../Map/ControlPanel/ControlPanel";
import * as S from "./Navbar.style";
import NavList from "./NavList/NavList";

export const MobileHeader = ({
  mapRef,
  toggleMenuVisibility,
  navMenuVisible,
  t,
}: {
  mapRef: React.RefObject<Map>;
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
    <LocationSearch
      setLocation={(position) => {
        setLocation(position);
        mapRef.current?.panTo(position);
      }}
      isMapPage={true}
    />
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

export const MobileCalendarHeader = ({ t }: { t: Function }) => (
  <S.MobileContainer>
    <S.GoBack href={urls.map} aria-label={t("navbar.mapPage")}>
      <img
        src={goBackIcon}
        alt={t("navbar.altGoBackIcon")}
        aria-label={t("navbar.goBack")}
      />
      {t("navbar.goBack")}
    </S.GoBack>
  </S.MobileContainer>
);
