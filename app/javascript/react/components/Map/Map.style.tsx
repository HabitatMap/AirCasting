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

const SessionButton = styled(Button)`
  top: 100px;
  position: relative;
  z-index: 99;
  background-color: transparent;
`;

export { MapElementsContainer, SessionButton, containerStyle };
