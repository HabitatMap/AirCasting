import styled, { css } from "styled-components";

import { blue, darkBlue, theme, white } from "../../../assets/styles/colors";
import { media } from "../../../utils/media";
import { BuyCTA } from "../Navbar.style";

const AircastingLogo = styled.img`
  width: 152px;
  height: 43px;
`;

const Button = styled.button`
  border: none;
  background: none;
  cursor: pointer;
`;

const Container = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const NavList = styled.ul<{ $isVisible?: boolean }>`
  background: ${theme};
  list-style-type: none;
  font-weight: 400;
  font-family: Moderat, sans-serif;
  height: 100vh;
  padding: 2.5rem 3.2rem;
  width: 100%;
  position: fixed;
  top: 0;
  right: ${(p) => (p.$isVisible ? "0" : "-35.2rem")};
  z-index: 5;
  -webkit-font-smoothing: antialiased;
  line-height: 1.5;
  letter-spacing: 0.5px;

  ${(p) =>
    p.$isVisible &&
    css`
      right: 0;
      opacity: 1;
      transition: right 0.5s ease-out, opacity 0.5s ease-out;
    `}

  @media ${media.smallDesktop} {
    min-width: 35.2rem;
    width: auto;
    ${(p) =>
      p.$isVisible &&
      css`
        right: 0;
        transition: right 0.3s ease;
      `}
  }
`;

const SubNav = styled.ul`
  padding: 0.8rem 0 1.6rem 0;
  border-bottom: 1px solid ${white};
  list-style-type: none;
`;

const NavHeader = styled.li`
  display: flex;
  justify-content: space-between;
  padding-bottom: 2.45rem;
  border-bottom: 1px solid ${white};
`;

const ListItem = styled.li<{ $isUnderline?: boolean; $isActive?: boolean }>`
  border-bottom: ${(p) => (p.$isUnderline ? "1px solid white" : "none")};
  opacity: ${(p) => (p.$isActive ? "0.5" : "1")};
`;

const SubNavTitleLink = styled.a`
  color: ${white};
  font-size: 2.2rem;
  display: inline-block;
  padding: 0.5rem 0;
  text-decoration: none;
  letter-spacing: 0.5rem;

  &:hover {
    opacity: 0.5;
  }

  @media ${media.smallDesktop} {
    font-size: 1.8rem;
  }
`;

const NavItemLink = styled(SubNavTitleLink)`
  font-size: 1.9rem;
  padding: 0.5rem 0;

  @media ${media.smallDesktop} {
    font-size: 1.5rem;
  }
`;

const Link = styled(NavItemLink)`
  text-transform: uppercase;
  font-size: 1.3rem;
`;

const BottomNavContainer = styled(Container)`
  border-top: 1px solid ${white};
  padding-top: 3.2rem;
`;

const BuyCTAWhite = styled(BuyCTA)`
  background-color: transparent;
  border: 1px solid ${white};
  color: ${white};
  border-radius: 0px;
  font-weight: 400;
  padding: 1.8rem 2rem;
  font-size: 1.3rem;

  &:visited,
  &:link,
  &:active {
    color: ${white};
  }

  &:hover {
    background-color: ${white};
    color: ${blue};
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
  AircastingLogo,
  BottomNavContainer,
  Button,
  BuyCTAWhite,
  Container,
  GoBack,
  Link,
  ListItem,
  NavHeader,
  NavItemLink,
  NavList,
  SubNav,
  SubNavTitleLink,
};
