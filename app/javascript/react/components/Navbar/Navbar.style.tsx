import styled, { css } from "styled-components";

import {
  cta,
  darkBlue,
  gray100,
  gray400,
  theme,
  white,
} from "../../assets/styles/colors";
import { media } from "../../utils/media";

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2rem;
  background: ${gray100};

  @media ${media.smallDesktop} {
    padding: 0 4.8rem;
    height: 7.8rem;
  }
`;

const MobileContainer = styled.div`
  display: flex;

  @media ${media.smallDesktop} {
    display: none;
  }
`;

const DesktopContainer = styled.div`
  display: none;

  @media ${media.smallDesktop} {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
  }
`;
const AircastingLogo = styled.img`
  width: 152px;
  height: 43px;
`;

const Button = styled.button`
  border: none;
  background: none;
`;

const MenuButton = styled(Button)`
  padding: 1.2rem;
  margin-left: 2rem;
  font-color: ${gray400};
  background-color: ${white};
  border-radius: 10px;
  box-shadow: 0px 4px 4px 0px rgba(76, 86, 96, 0.1);
  width: 48px;
  height: 42px;
`;

const BuyCTA = styled.a`
  background-color: ${cta};
  text-transform: uppercase;
  font-weight: 400;
  font-size: 1.2rem;
  padding: 1.3rem 2rem;
  display: flex;
  align-items: center;
  letter-spacing: 0.14px;
  height: 42px;
  border-radius: 10px;
  gap: 8px;
  text-decoration: none;
  box-shadow: 0px 2px 2px 0px rgba(76, 86, 96, 0.15);

  &:visited,
  &:link,
  &:active {
    color: ${gray400};
  }
`;

const Container = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const NavList = styled.ul<{ $isVisible?: boolean }>`
  background: ${theme};
  list-style-type: none;
  font-weight: 500;
  font-family: Moderat-Bold, sans-serif;
  height: 100vh;
  padding: 2rem 3.2rem;
  min-width: 35.2rem;
  position: fixed;
  top: 0;
  right: ${(p) => (p.$isVisible ? "0" : "-35.2rem")};
  z-index: 99;
  -webkit-font-smoothing: antialiased;
  line-height: 1.5;

  ${(p) =>
    p.$isVisible &&
    css`
      right: 0;
      transition: right 0.3s ease;
    `}
`;

const SubNav = styled.ul`
  padding: 0.8rem 0 1.6rem 0;
  border-bottom: 1px solid ${white};
  list-style-type: none;
`;

const NavHeader = styled.li`
  display: flex;
  justify-content: space-between;
  padding-bottom: 2.4rem;
  border-bottom: 1px solid ${white};
`;

const ListItem = styled.li<{ $isUnderline?: boolean }>`
  border-bottom: ${(p) => (p.$isUnderline ? "1px solid white" : "none")};
  &.active {
    opacity: 0.5;
  }
`;

const SubNavTitleLink = styled.a`
  color: ${white};
  font-size: 1.8rem;
  display: inline-block;
  padding: 0.5rem 0;
  text-decoration: none;
  font-weight: 600;
`;

const NavItemLink = styled(SubNavTitleLink)`
  font-size: 1.5rem;
  padding: 0.5rem 0;
`;

const Link = styled(NavItemLink)`
  text-transform: uppercase;
`;

const BottomNavContainer = styled(Container)`
  padding-top: 3.2rem;
`;

const BuyCTAWhite = styled(BuyCTA)`
  background-color: transparent;
  border: 1px solid ${white};
  color: ${white};
  border-radius: 0px;
  font-weight: 600;
  padding: 1.5rem 2rem;

  &:visited,
  &:link,
  &:active {
    color: ${white};
  }
`;

const GoBack = styled.a`
  text-transform: uppercase;
  text-decoration: none;
  font-weight: 600;
  font-size: 1.3rem;
  color: ${darkBlue};
  display: flex;
  align-items: center;
  gap: 15px;
  line-height: 22px;
`;

export {
  Header,
  AircastingLogo,
  Button,
  MenuButton,
  BuyCTA,
  Container,
  NavList,
  SubNav,
  NavHeader,
  ListItem,
  SubNavTitleLink,
  NavItemLink,
  Link,
  BottomNavContainer,
  MobileContainer,
  DesktopContainer,
  GoBack,
  BuyCTAWhite,
};
