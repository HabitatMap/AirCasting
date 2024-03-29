import styled, { css } from "styled-components";

import { cta, theme, white } from "../../assets/styles/colors";

const Header = styled.header`
  background-color: ${white};
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 4.8rem;
  height: 7.8rem;
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
  padding: 0 0.6rem;
  margin-left: 2.4rem;
`;

const BuyCTA = styled.a`
  background-color: ${cta};
  text-transform: uppercase;
  font-weight: 400;
  padding: 1.3rem 2rem;
`;

const Container = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const NavList = styled.ul<{ $isVisible?: boolean }>`
  background: ${theme};
  list-style-type: none;
  display: none;
  height: 100vh;
  padding: 2rem 3.2rem;
  min-width: 35.2rem;
  position: absolute;
  top: 0;
  bottom: 0;
  right: 0;
  z-index: 1;

  ${(p) =>
    p.$isVisible &&
    css`
      display: inline-block;
      animation: slide-left 0.3s ease 1;
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
`;

const SubNavTitleLink = styled.a`
  color: ${white};
  font-size: 1.9rem;
  display: inline-block;
  padding: 0.8rem 0;
`;

const NavItemLink = styled(SubNavTitleLink)`
  font-size: 1.6rem;
  padding: 0.4rem 0 0.8rem 0;
`;

const Link = styled(NavItemLink)`
  text-transform: uppercase;
`;

const BottomNavContainer = styled(Container)`
  padding-top: 2.4rem;
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
};
