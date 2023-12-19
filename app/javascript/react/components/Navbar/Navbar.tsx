import React, { ReactNode, useState } from "react";

import logo from "../../../../assets/images/aircasting-logo-nav.svg";
import hamburger from "../../assets/icons/hamburger.svg";
import habitatMapLogo from "../../assets/icons/habitatMapLogo.svg";
import iconNavClose from "../../assets/icons/iconNavClose.svg";
import serchIcon from "../../assets/icons/searchIcon.svg";
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

  return (
    <S.Header>
      <a href="https://www.habitatmap.org/" aria-label="AirCasting page">
        <S.AircastingLogo alt="Aircasting logo" src={logo} />
      </a>
      <S.Container>
        <S.BuyCTA href={urls.airbeamBuy}>get airbeam</S.BuyCTA>
        <nav>
        <S.MenuButton onClick={() => setNavMenuVisible(true)}>
            <img src={hamburger} alt="Menu icon" aria-label="Open menu"></img>
          </S.MenuButton>
        </nav>
      </S.Container>
      <S.NavList $isVisible={navMenuVisible}>
        <S.NavHeader>
          <a href={urls.habitatMap} aria-label="HabitatMap page">
            <img src={habitatMapLogo} alt="Habitatmap logo" />
          </a>
          <S.Button onClick={() => setNavMenuVisible(false)}>
            <img
              src={iconNavClose}
              aria-label="Close navigation menu"
              alt="Close icon"
            />
          </S.Button>
        </S.NavHeader>
        <NavItem isNavTitle href={urls.airbeam}>
          AirBeam
        </NavItem>
        <S.SubNav>
          <NavItem href={urls.airbeamUserStories}>User Stories</NavItem>
          <NavItem href={urls.airbeamHowItWorks}>How it Works</NavItem>
          <NavItem href={urls.airbeamFaq}>FAQ</NavItem>
          <NavItem href={urls.airbeamUsersGuide}>User's Guide</NavItem>
          <NavItem href={urls.airbeamBuy}>Buy it Now</NavItem>
        </S.SubNav>
        <NavItem isNavTitle href={urls.aircasting}>
          AirCasting
        </NavItem>
        <S.SubNav>
          <NavItem href={urls.map}>AirCasting Maps</NavItem>
          <NavItem href={urls.android}>Android App</NavItem>
          <NavItem href={urls.iOS}>iOS App</NavItem>
          <NavItem href={urls.actions}>AirCasting Actions</NavItem>
        </S.SubNav>
        <NavItem isNavTitle href={urls.about}>
          About HabitatMap
        </NavItem>
        <S.SubNav>
          <NavItem href={urls.history}>History & People</NavItem>
          <NavItem href={urls.press}>Press</NavItem>
        </S.SubNav>
        <NavItem isNavTitle isUnderline href={urls.blog}>
          TakingSpace Blog
        </NavItem>
        <S.BottomNavContainer>
          <a href={urls.search}>
            <img src={serchIcon} alt="Search icon" aria-label="Open search" />
          </a>
          <S.Link href={urls.donate}>Donate</S.Link>
          <S.BuyCTA href={urls.airbeamBuy}>Get Airbeam</S.BuyCTA>
        </S.BottomNavContainer>
      </S.NavList>
    </S.Header>
  );
};

export { Navbar };
