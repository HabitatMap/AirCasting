import styled from "styled-components";
import { media } from "../../utils/media";

import { Button } from "../Button/Button.style";

const containerStyle = {
  width: "100%",
  height: "100vh",
};

const FixedButton = styled(Button)`
  top: 150px;
  position: absolute;
  z-index: 99;
  text-transform: uppercase;
`;

const MobileButton = styled(Button)`
  top: 200px;
  position: absolute;
  z-index: 99;
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

export {
  DesktopContainer,
  FixedButton,
  MobileButton,
  MobileContainer,
  containerStyle,
};
