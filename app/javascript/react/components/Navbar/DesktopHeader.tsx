import React from "react";

import logo from "../../../../assets/images/aircasting-logo-nav.svg";
import airbeamIcon from "../../assets/icons/airbeamIcon.svg";
import hamburger from "../../assets/icons/hamburger.svg";
import { urls } from "../../const/urls";
import { LatLngLiteral, Map } from "../../types/googleMaps";
import { LocationSearch } from "../LocationSearch";
import { ControlPanel } from "../Map/ControlPanel/ControlPanel";
import * as S from "./Navbar.style";
import NavList from "./NavList/NavList";

interface DesktopHeaderProps {
  isMapPage: boolean;
  navMenuVisible: boolean;
  toggleMenuVisibility: () => void;
  t: (key: string) => string;
  mapRef: React.RefObject<Map>;
}

const DesktopHeader: React.FC<DesktopHeaderProps> = ({
  isMapPage,
  navMenuVisible,
  toggleMenuVisibility,
  t,
  mapRef,
}) => (
  <S.DesktopContainer>
    {isMapPage ? (
      <>
        <S.SearchContainer>
          <a
            href={urls.habitatMap}
            aria-label={t("navbar.sections.aircastingPage")}
          >
            <S.AircastingLogo alt={t("navbar.altLogo")} src={logo} />
          </a>

          <LocationSearch
            setLocation={(position) => {
              setLocation(position);
              mapRef.current?.panTo(position);
            }}
          />
        </S.SearchContainer>
        <ControlPanel />
      </>
    ) : (
      <a
        href={urls.habitatMap}
        aria-label={t("navbar.sections.aircastingPage")}
      >
        <S.AircastingLogo alt={t("navbar.altLogo")} src={logo} />
      </a>
    )}
    <S.Container>
      <S.BuyCTA href={urls.airbeamBuyNow}>
        {t("navbar.sections.getAirbeam")}
        <img
          src={airbeamIcon}
          alt={t("navbar.altAirbeamIcon")}
          aria-label={t("navbar.altAirbeamIcon")}
        />
      </S.BuyCTA>
      <nav>
        <S.MenuButton onClick={toggleMenuVisibility}>
          <img
            src={hamburger}
            alt={t("navbar.altMenu")}
            aria-label={t("navbar.sections.openMenu")}
          />
        </S.MenuButton>
      </nav>
    </S.Container>
    <NavList
      t={t}
      navMenuVisible={navMenuVisible}
      toggleMenuVisibility={toggleMenuVisibility}
    />
  </S.DesktopContainer>
);

export default DesktopHeader;
