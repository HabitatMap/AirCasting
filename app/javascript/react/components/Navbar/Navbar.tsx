import React, { ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";

import logo from "../../../../assets/images/aircasting-logo-nav.svg";
import hamburger from "../../assets/icons/hamburger.svg";
import habitatMapLogo from "../../assets/icons/habitatMapLogo.svg";
import iconNavClose from "../../assets/icons/iconNavClose.svg";
import serchIcon from "../../assets/icons/searchIcon.svg";
import airbeamIcon from "../../assets/icons/airbeamIcon.svg";
import goBackIcon from "../../assets/icons/goBackIcon.svg";
import { urls } from "../../const/urls";
import * as S from "./Navbar.style";

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
  const { t } = useTranslation();

  return (
    <S.Header>
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
      <S.DesktopContainer>
        <a
          href={urls.habitatMap}
          aria-label={t("navbar.sections.aircastingPage")}
        >
          <S.AircastingLogo alt={t("navbar.altLogo")} src={logo} />
        </a>
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
            <S.MenuButton onClick={() => setNavMenuVisible(true)}>
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
            <S.Button onClick={() => setNavMenuVisible(false)}>
              <img
                src={iconNavClose}
                aria-label={t("navbar.altClose")}
                alt={t("navbar.altClose")}
              />
            </S.Button>
          </S.NavHeader>
          <NavItem isNavTitle href={urls.airbeam}>
            {t("navbar.sections.airbeam")}
          </NavItem>
          <S.SubNav>
            <NavItem href={urls.userStories}>
              {t("navbar.sections.userStories")}
            </NavItem>
            <NavItem href={urls.airbeamHowItWorks}>
              {t("navbar.sections.howItWorks")}
            </NavItem>
            <NavItem href={urls.faq}>{t("navbar.sections.faq")}</NavItem>
            <NavItem href={urls.usersGuide}>
              {t("navbar.sections.usersGuide")}
            </NavItem>
            <NavItem href={urls.airbeamBuyNow}>
              {t("navbar.sections.airbeamBuyNow")}
            </NavItem>
          </S.SubNav>
          <NavItem isNavTitle href={urls.aircasting}>
            {t("navbar.sections.aircasting")}
          </NavItem>
          <S.SubNav>
            <NavItem href={urls.map}>{t("navbar.sections.maps")}</NavItem>
            <NavItem href={urls.android}>
              {t("navbar.sections.androidApp")}
            </NavItem>
            <NavItem href={urls.iOS}>{t("navbar.sections.iOSApp")}</NavItem>
            <NavItem href={urls.actions}>
              {t("navbar.sections.actions")}
            </NavItem>
          </S.SubNav>
          <NavItem isNavTitle href={urls.about}>
            {t("navbar.sections.about")}
          </NavItem>
          <S.SubNav>
            <NavItem href={urls.history}>
              {t("navbar.sections.history")}
            </NavItem>
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
            <S.BuyCTA href={urls.airbeamBuyNow}>
              {t("navbar.sections.getAirbeam")}
            </S.BuyCTA>
          </S.BottomNavContainer>
        </S.NavList>
      </S.DesktopContainer>
    </S.Header>
  );
};

export { Navbar };
