import styled from "styled-components";

import { NAVBAR_HEIGHT } from "../Navbar/Navbar.style";

const containerStyle = {
  width: "100%",
  height: "100vh",
  display: "flex",
};

const MapElementsContainer = styled.div`
  position: absolute;
  z-index: 2;
  display: flex;
`;

export { MapElementsContainer, containerStyle };
