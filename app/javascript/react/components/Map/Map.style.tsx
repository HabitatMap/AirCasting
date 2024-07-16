import styled from "styled-components";

import * as colors from "../../assets/styles/colors";
import { media } from "../../utils/media";
import { Button } from "../Button/Button.style";

const containerStyle = {
  width: "100%",
  height: "100vh",
};

const FixedButton = styled(Button)`
  top: 200px;
  position: absolute;
  z-index: 1;
  text-transform: uppercase;
`;

const MobileButton = styled(Button)`
  top: 250px;
  position: absolute;
  z-index: 1;
  text-transform: uppercase;
`;

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

const MobileButtons = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  justify-content: end;
  gap: 1rem;
  flex-direction: column;
  position: fixed;
  bottom: 0.1rem;
  right: 0.4rem;
  direction: rtl;
`;

const ThresholdContainer = styled.div`
  display: grid;
  justify-content: center;
  flex-direction: column;
  position: fixed;

  grid-gap: 5rem;
  width: 100%;
  bottom: 0;

  z-index: 2;
  background-color: ${colors.white};
  box-shadow: 2px 2px 4px 0px ${colors.gray900};

  @media (${media.desktop}) {
    padding: 1.1rem 4.1rem;
    height: 6.4rem;
    grid-template-columns: 1fr auto;
    margin-bottom: 0;
  }

  @media (${media.smallDesktop}) {
    padding: 1.1rem 4.1rem;
    height: 6.4rem;
    grid-template-columns: 1fr auto;
    margin-bottom: 0;
  }

  @media (${media.largeDesktop}) {
    padding: 1.1rem 4.1rem;
    height: 6.4rem;
    grid-template-columns: 1fr auto;
    margin-bottom: 0;
  }

  @media (${media.mobile}) {
    height: 4.7rem;
    margin-bottom: 0;
    grid-template-columns: 1fr;
  }
`;

export {
  containerStyle,
  DesktopContainer,
  FixedButton,
  MobileButton,
  MobileButtons,
  MobileContainer,
  ThresholdContainer,
};
