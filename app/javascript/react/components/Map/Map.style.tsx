import styled from "styled-components";

import * as colors from "../../assets/styles/colors";
import { media } from "../../utils/media";

const ContainerStyle = {
  width: "100%",
  height: "100vh",
  overflow: "hidden",
};

const DesktopContainer = styled.div`
  display: none;

  @media (${media.desktop}) {
    display: flex;
  }
`;

const MobileContainer = styled.div`
  @media (${media.desktop}) {
    display: none;
  }
`;

const MobileButtons = styled.div<{ $isTimelapseView: boolean }>`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  justify-items: center;
  align-items: center;
  gap: 1rem;
  position: fixed;
  bottom: 0.1rem;
  right: 1.4rem;
  direction: rtl;
  ${(props) => props.$isTimelapseView && "z-index: 3;"}

  @media (min-width: 390px) {
    right: 3.5rem;
  }

  @media (${media.smallDesktop}) {
    right: 0.4rem;
  }
`;

const ThresholdContainer = styled.div`
  display: grid;
  justify-content: center;
  flex-direction: column;
  position: fixed;

  grid-gap: 5rem;
  width: 100%;
  bottom: 0;

  z-index: 1;
  background-color: ${colors.white};
  box-shadow: 2px 2px 4px 0px ${colors.gray900};

  @media (${media.mobile}) {
    height: 4.7rem;
    margin-bottom: 0;
    grid-template-columns: 1fr;
  }

  @media (min-width: 769px) and (max-width: 1023px) {
    padding: 0.6rem 0.5rem 0.6rem 0;
    height: 4.7rem;
    grid-template-columns: 1fr auto;
    margin-bottom: 0;
    align-items: center;
    grid-gap: 0.5rem;
  }

  @media (${media.desktop}) {
    padding: 1.6rem 4.1rem;
    height: 6.4rem;
    grid-template-columns: 1fr auto;
    margin-bottom: 0;
  }

  @media (${media.largeDesktop}) {
    padding: 1.6rem 4.1rem;
    height: 6.4rem;
    grid-template-columns: 1fr auto;
    margin-bottom: 0;
  }
`;

const LoaderOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.5);
  z-index: 9999;
`;

export {
  ContainerStyle,
  DesktopContainer,
  LoaderOverlay,
  MobileButtons,
  MobileContainer,
  ThresholdContainer,
};
