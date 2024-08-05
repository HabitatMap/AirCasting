import React from "react";

import logo from "../../../../assets/images/aircasting-logo-nav.svg";
import mobileLogo from "../../assets/icons/airCastingLogoMobile.svg";
import airbeamIcon from "../../assets/icons/airbeamIcon.svg";
import hamburger from "../../assets/icons/hamburger.svg";

import { urls } from "../../const/urls";
import { screenSizes } from "../../utils/media";
import useScreenSizeDetection from "../../utils/useScreenSizeDetection";
import { LocationSearch } from "../LocationSearch";
import { ControlPanel } from "../Map/ControlPanel/ControlPanel";
import { RealtimeMapUpdatesButton } from "../RealtimeMapUpdatesButton/RealtimeMapUpdatesButton";
import { RefreshMapButton } from "../RefreshMapButton";
import NavList from "./NavList/NavList";
import * as S from "./Navbar.style";

interface DesktopHeaderProps {
  isMapPage: boolean;
  navMenuVisible: boolean;
  toggleMenuVisibility: () => void;
  t: (key: string) => string;
}

const DesktopHeader: React.FC<DesktopHeaderProps> = ({
  isMapPage,
  navMenuVisible,
  toggleMenuVisibility,
  t,
}) => {
  const isSmallScreen = useScreenSizeDetection(screenSizes.largeDesktop);

  return (
    <S.DesktopContainer>
      {isMapPage ? (
        <>
          <S.Container>
            <S.SearchContainer>
              <a
                href={urls.habitatMap}
                aria-label={t("navbar.sections.aircastingPage")}
              >
                <S.AircastingLogo
                  alt={t("navbar.altLogo")}
                  src={isSmallScreen ? mobileLogo : logo}
                  $isSmallScreen={isSmallScreen}
                />
              </a>
              <LocationSearch />
            </S.SearchContainer>
            <S.MapControls>
              <RefreshMapButton />
              <RealtimeMapUpdatesButton />
              <ControlPanel />
            </S.MapControls>
          </S.Container>
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
          {isSmallScreen ? "" : t("navbar.sections.getAirbeam")}
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
};

export default DesktopHeader;
