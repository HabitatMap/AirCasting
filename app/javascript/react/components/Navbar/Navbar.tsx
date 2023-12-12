import React, { ReactNode, useState } from "react";

import logo from "../../../../assets/images/aircasting-logo-nav.svg";
import hamburger from "../../assets/icons/hamburger.svg";
import habitatMapLogo from "../../assets/icons/habitatMapLogo.svg";
import iconNavClose from "../../assets/icons/iconNavClose.svg";
import serchIcon from "../../assets/icons/searchIcon.svg";
import { urls } from "../../const/urls";
import * as S from "./Navbar.style";
import { useTranslation } from "react-i18next";

const NavItem = ({
  href,
  isNavTitle,
  isUnderline,
  children,
}: {
  href: string;
  isNavTitle?: boolean;
  isUnderline?: boolean;
  children?: ReactNode;
}) => (
  <S.ListItem $isUnderline={isUnderline}>
    {isNavTitle ? (
      <S.SubNavTitleLink href={href}>{children}</S.SubNavTitleLink>
    ) : (
      <S.NavItemLink href={href}>{children}</S.NavItemLink>
    )}
  </S.ListItem>
);

const Navbar = () => {
  const [navMenuVisible, setNavMenuVisible] = useState(false);
  const { t, i18n } = useTranslation();

  return (
    <S.Header>
      <a href="https://www.habitatmap.org/" aria-label="AirCasting page">
        <S.AircastingLogo alt={t("navbar.altLogo")} src={logo} />
      </a>
      <S.Container>
        <S.BuyCTA href={urls.airbeamBuy}>
          {t("navbar.sections.getAirBeam")}
        </S.BuyCTA>
        <nav>
          <S.MenuButton onClick={() => setNavMenuVisible(true)}>
            <img
              src={hamburger}
              alt={t("navbar.altMenu")}
              aria-label="Open menu"
            ></img>
          </S.MenuButton>
        </nav>
      </S.Container>
      <S.NavList $isVisible={navMenuVisible}>
        <S.NavHeader>
          <a href={urls.habitatMap} aria-label="HabitatMap page">
            <img src={habitatMapLogo} alt={t("navbar.altHabitatLogo")} />
          </a>
          <S.Button onClick={() => setNavMenuVisible(false)}>
            <img
              src={iconNavClose}
              aria-label={t("navbar.altClose")}
              alt={t("navbar.altClose")}
            />
          </S.Button>
        </S.NavHeader>
        <NavItem isNavTitle href={urls.airbeam}>
          {t("navbar.sections.airBeam")}
        </NavItem>
        <S.SubNav>
          <NavItem href={urls.airbeamUserStories}>
            {t("navbar.sections.userStories")}
          </NavItem>
          <NavItem href={urls.airbeamHowItWorks}>
            {t("navbar.sections.work")}
          </NavItem>
          <NavItem href={urls.airbeamFaq}>{t("navbar.sections.faq")}</NavItem>
          <NavItem href={urls.airbeamUsersGuide}>
            {t("navbar.sections.usersGuide")}
          </NavItem>
          <NavItem href={urls.airbeamBuy}>
            {t("navbar.sections.buyNow")}
          </NavItem>
        </S.SubNav>
        <NavItem isNavTitle href={urls.aircasting}>
          {t("navbar.sections.airCasting")}
        </NavItem>
        <S.SubNav>
          <NavItem href={urls.map}>{t("navbar.sections.maps")}</NavItem>
          <NavItem href={urls.android}>
            {t("navbar.sections.androidApp")}
          </NavItem>
          <NavItem href={urls.iOS}>{t("navbar.sections.iosApp")}</NavItem>
          <NavItem href={urls.actions}>{t("navbar.sections.actions")}</NavItem>
        </S.SubNav>
        <NavItem isNavTitle href={urls.about}>
          {t("navbar.sections.about")}
        </NavItem>
        <S.SubNav>
          <NavItem href={urls.history}>{t("navbar.sections.history")}</NavItem>
          <NavItem href={urls.press}>{t("navbar.sections.press")}</NavItem>
        </S.SubNav>
        <NavItem isNavTitle isUnderline href={urls.blog}>
          {t("navbar.sections.blog")}
        </NavItem>
        <S.BottomNavContainer>
          <a href={urls.search}>
            <img
              src={serchIcon}
              alt={t("navbar.altSearch")}
              aria-label={t("navbar.altSearch")}
            />
          </a>
          <S.Link href={urls.donate}>{t("navbar.sections.donate")}</S.Link>
          <S.BuyCTA href={urls.airbeamBuy}>
            {t("navbar.sections.getAirBeam")}
          </S.BuyCTA>
        </S.BottomNavContainer>
      </S.NavList>
    </S.Header>
  );
};

export { Navbar };
