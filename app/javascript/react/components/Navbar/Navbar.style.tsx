import styled from "styled-components";

import { black, blue, cta, gray400, white } from "../../assets/styles/colors";
import { media } from "../../utils/media";

const NAVBAR_HEIGHT = "7.8rem";

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: transparent;
  z-index: 2;
  flex-wrap: wrap;
  position: absolute;

  @media ${media.desktop} {
    height: ${NAVBAR_HEIGHT};
    position: absolute;
    width: 100%;
    margin: 0 auto;
    top: 0;
    left: 0;
  }
`;

const MobileContainer = styled.div`
  display: flex;
  padding: 1.5rem 2rem;

  @media ${media.desktop} {
    display: none;
  }
`;

const DesktopContainer = styled.div`
  display: none;

  @media ${media.desktop} {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    padding: 2rem;
    flex-wrap: wrap;
    gap: 1rem;
    flex-direction: flex-reverse;
  }
`;

const SearchContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 2px 2px 4px 0px rgba(76, 86, 96, 0.1);
  border-radius: 10px;
  background-color: ${white};
  padding: 1rem 1.5rem;
  gap: 2rem;
`;

const AircastingLogo = styled.img<{ $isSmallScreen?: boolean }>`
  width: ${({ $isSmallScreen }) => ($isSmallScreen ? "3.5rem" : "15rem")};
  height: 4.3rem;
`;

const Button = styled.button`
  border: none;
  background: none;
`;

const MenuButton = styled(Button)`
  background-color: transparent;
  display: flex;
  align-items: center;
  cursor: pointer;

  @media ${media.desktop} {
    background-color: ${white};
    border-radius: 10px;
    box-shadow: 0px 4px 4px 0px rgba(76, 86, 96, 0.1);
    font-color: ${gray400};
    padding: 1.2rem;
    margin-left: 2rem;
    width: 48px;
    height: 42px;
  }
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

const BottomNavContainer = styled(Container)`
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
  text-decoration: none;
  font-weight: 400;
  font-size: 1.2rem;
  color: ${black};
  display: flex;
  align-items: center;
  gap: 7px;
  line-height: 22px;
  box-shadow: 0px 2px 2px 0px rgba(76, 86, 96, 0.15);
  background-color: ${white};
  padding: 0.5rem 1rem;
  border-radius: 5px;
`;

const MobileMenuContainer = styled.div`
  width: 61px;
  height: 32px;
  box-shadow: 2px 2px 4px 0px rgba(76, 86, 96, 0.1);
  border-radius: 10px;
  background-color: ${white};
  display: flex;
  justify-content: space-evenly;
  align-items: center;
  cursor: pointer;
`;

const MobileHeaderContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  flex-wrap: wrap;
  @media ${media.desktop} {
    display: none;
  }
`;

export {
  AircastingLogo,
  BottomNavContainer,
  Button,
  BuyCTA,
  BuyCTAWhite,
  Container,
  DesktopContainer,
  GoBack,
  Header,
  MenuButton,
  MobileContainer,
  MobileHeaderContainer,
  MobileMenuContainer,
  NAVBAR_HEIGHT,
  SearchContainer,
};
