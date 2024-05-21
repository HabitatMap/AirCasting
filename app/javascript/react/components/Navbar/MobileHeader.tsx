import React from "react";

import airCastingLogoMobile from "../../assets/icons/airCastingLogoMobile.svg";
import hamburgerMobile from "../../assets/icons/hamburgerMobile.svg";
import goBackIcon from "../../assets/icons/goBackIcon.svg";
import { urls } from "../../const/urls";
import * as S from "./Navbar.style";
import { LocationSearch } from "../LocationSearch";
import { Map } from "../../types/googleMaps";
import { ControlPanel } from "../Map/ControlPanel/ControlPanel";

export const MobileHeader = ({
  setLocation,
  mapRef,
  setNavMenuVisible,
  t,
}: {
  setLocation: Function;
  mapRef: React.RefObject<Map>;
  setNavMenuVisible: Function;
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
        <S.MenuButton onClick={() => setNavMenuVisible(true)}>
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
