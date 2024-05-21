import React from "react";

import logo from "../../../../assets/images/aircasting-logo-nav.svg";
import hamburger from "../../assets/icons/hamburger.svg";
import habitatMapLogo from "../../assets/icons/habitatMapLogo.svg";
import iconNavClose from "../../assets/icons/iconNavClose.svg";
import searchIcon from "../../assets/icons/searchIcon.svg";
import airbeamIcon from "../../assets/icons/airbeamIcon.svg";
import { urls } from "../../const/urls";
import * as S from "./Navbar.style";
import { LocationSearch } from "../LocationSearch";
import { LatLngLiteral, Map } from "../../types/googleMaps";
import { ControlPanel } from "../Map/ControlPanel/ControlPanel";
import NavItem from "./NavItem";
import { navItems } from "./navItemsList";

const DesktopHeader = ({
  isMapPage,
  navMenuVisible,
  toggleMenuVisibility,
  t,
  setLocation,
  mapRef,
}: {
  isMapPage: boolean;
  navMenuVisible: boolean;
  toggleMenuVisibility: () => void;
  t: any;
  setLocation: (location: LatLngLiteral) => void;
  mapRef: React.RefObject<Map>;
}) => (
  <S.DesktopContainer>
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
    {isMapPage && <ControlPanel />}
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
    <S.NavList $isVisible={navMenuVisible}>
      <S.NavHeader>
        <a
          href={urls.habitatMap}
          aria-label={t("navbar.sections.habitatMapPage")}
        >
          <img src={habitatMapLogo} alt={t("navbar.altHabitatMapLogo")} />
        </a>
        <S.Button onClick={toggleMenuVisibility}>
          <img
            src={iconNavClose}
            aria-label={t("navbar.altClose")}
            alt={t("navbar.altClose")}
          />
        </S.Button>
      </S.NavHeader>
      {navItems.map((item) => (
        <NavItem
          key={item.href}
          href={item.href}
          isNavTitle={item.isNavTitle}
          isActive={window.location.pathname === item.href}
          subNav={item.subNav?.map((subItem) => ({
            ...subItem,
            label: t(subItem.label),
          }))}
        >
          {t(item.label)}
        </NavItem>
      ))}
      <S.BottomNavContainer>
        <a href={urls.search}>
          <img
            src={searchIcon}
            alt={t("navbar.altSearch")}
            aria-label={t("navbar.altSearch")}
            style={{ width: "30px" }}
          />
        </a>
        <S.Link href={urls.donate} style={{ fontSize: "1.2rem" }}>
          {t("navbar.sections.donate")}
        </S.Link>
        <S.BuyCTAWhite href={urls.airbeamBuyNow}>
          {t("navbar.sections.getAirbeam")}
        </S.BuyCTAWhite>
      </S.BottomNavContainer>
    </S.NavList>
  </S.DesktopContainer>
);

export default DesktopHeader;
