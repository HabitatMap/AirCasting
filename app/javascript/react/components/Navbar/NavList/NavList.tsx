import React from "react";
import habitatMapLogo from "../../../assets/icons/habitatMapLogo.svg";
import iconNavClose from "../../../assets/icons/iconNavClose.svg";
import searchIcon from "../../../assets/icons/searchIcon.svg";
import { urls } from "../../../const/urls";
import NavItem from "./NavItem";
import * as S from "./NavList.style";
import { navItems } from "./navItemsList";

interface NavListProps {
  t: (key: string) => string;
  navMenuVisible: boolean;
  toggleMenuVisibility: () => void;
}

const NavList: React.FC<NavListProps> = ({
  t,
  navMenuVisible,
  toggleMenuVisibility,
}) => (
  <S.NavList $isVisible={navMenuVisible}>
    <S.NavHeader>
      <a
        href={urls.habitatMap}
        aria-label={t("navbar.sections.habitatMapPage")}
        style={{ display: "flex", alignItems: "center" }}
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
        isUnderline={item.isUnderline}
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
);

export default NavList;
