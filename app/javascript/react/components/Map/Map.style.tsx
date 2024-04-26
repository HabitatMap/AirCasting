import styled from "styled-components";

import { NAVBAR_HEIGHT } from "../Navbar/Navbar.style";

const containerStyle = {
  width: "100%",
  height: `calc(100vh - ${NAVBAR_HEIGHT})`,
  display: "flex",
};

const MapElementsContainer = styled.div`
  position: absolute;
  z-index: 2;
  display: flex;
`;

export { MapElementsContainer, containerStyle };
