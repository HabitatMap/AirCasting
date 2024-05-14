import React, { ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";

import logo from "../../../../assets/images/aircasting-logo-nav.svg";
import hamburger from "../../assets/icons/hamburger.svg";
import habitatMapLogo from "../../assets/icons/habitatMapLogo.svg";
import iconNavClose from "../../assets/icons/iconNavClose.svg";
import searchIcon from "../../assets/icons/searchIcon.svg";
import airbeamIcon from "../../assets/icons/airbeamIcon.svg";
import goBackIcon from "../../assets/icons/goBackIcon.svg";
import { urls } from "../../const/urls";
import * as S from "./Navbar.style";

const NavItem = ({
  href,
  isNavTitle,
  isUnderline,
  isActive,
  children,
}: {
  href: string;
  isNavTitle?: boolean;
  isUnderline?: boolean;
  isActive?: boolean;
  children?: ReactNode;
}) => {
  console.log(isActive);
  return (
    <S.ListItem $isUnderline={isUnderline} $isActive={isActive}>
      {isNavTitle ? (
        <S.SubNavTitleLink href={href}>{children}</S.SubNavTitleLink>
      ) : (
        <S.NavItemLink href={href}>{children}</S.NavItemLink>
      )}
    </S.ListItem>
  );
};

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
          <NavItem
            isNavTitle
            href={urls.airbeam}
            isActive={window.location.pathname === urls.airbeam}
          >
            {t("navbar.sections.airbeam")}
          </NavItem>
          <S.SubNav>
            <NavItem
              href={urls.userStories}
              isActive={window.location.pathname === urls.userStories}
            >
              {t("navbar.sections.userStories")}
            </NavItem>
            <NavItem
              href={urls.airbeamHowItWorks}
              isActive={window.location.pathname === urls.airbeamHowItWorks}
            >
              {t("navbar.sections.howItWorks")}
            </NavItem>
            <NavItem
              href={urls.faq}
              isActive={window.location.pathname === urls.faq}
            >
              {t("navbar.sections.faq")}
            </NavItem>
            <NavItem
              href={urls.usersGuide}
              isActive={window.location.pathname === urls.usersGuide}
            >
              {t("navbar.sections.usersGuide")}
            </NavItem>
            <NavItem
              href={urls.airbeamBuyNow}
              isActive={window.location.pathname === urls.airbeamBuyNow}
            >
              {t("navbar.sections.airbeamBuyNow")}
            </NavItem>
          </S.SubNav>
          <NavItem
            isNavTitle
            href={urls.aircasting}
            isActive={window.location.pathname === urls.aircasting}
          >
            {t("navbar.sections.aircasting")}
          </NavItem>
          <S.SubNav>
            <NavItem
              href={urls.map}
              isActive={window.location.pathname === urls.map}
            >
              {t("navbar.sections.maps")}
            </NavItem>
            <NavItem
              href={urls.android}
              isActive={window.location.pathname === urls.android}
            >
              {t("navbar.sections.androidApp")}
            </NavItem>
            <NavItem
              href={urls.iOS}
              isActive={window.location.pathname === urls.iOS}
            >
              {t("navbar.sections.iOSApp")}
            </NavItem>
            <NavItem
              href={urls.actions}
              isActive={window.location.pathname === urls.actions}
            >
              {t("navbar.sections.actions")}
            </NavItem>
          </S.SubNav>
          <NavItem
            isNavTitle
            href={urls.about}
            isActive={window.location.pathname === urls.about}
          >
            {t("navbar.sections.about")}
          </NavItem>
          <S.SubNav>
            <NavItem
              href={urls.history}
              isActive={window.location.pathname === urls.history}
            >
              {t("navbar.sections.history")}
            </NavItem>
            <NavItem
              href={urls.press}
              isActive={window.location.pathname === urls.press}
            >
              {t("navbar.sections.press")}
            </NavItem>
          </S.SubNav>
          <NavItem
            isNavTitle
            isUnderline
            href={urls.blog}
            isActive={window.location.pathname === urls.blog}
          >
            {t("navbar.sections.blog")}
          </NavItem>
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
    </S.Header>
  );
};

export { Navbar };
