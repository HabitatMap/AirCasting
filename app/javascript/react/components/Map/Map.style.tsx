import styled from "styled-components";

import { Button } from "../Button/Button.style";

const containerStyle = {
  width: "100%",
  height: "100vh",
};

const MapElementsContainer = styled.div`
  position: absolute;
  z-index: 2;
  display: flex;
`;

const FixedButton = styled(Button)`
  top: 150px;
  position: absolute;
  z-index: 99;
`;

const MobileButton = styled(Button)`
  top: 200px;
  position: absolute;
  z-index: 99;
`;

export { MapElementsContainer, FixedButton, MobileButton, containerStyle };
