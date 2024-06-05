import styled from "styled-components";

import { blue } from "../../assets/styles/colors";

interface StyledMapContainerProps {
  isTabbing: boolean;
}

const StyledMapContainer = styled.div<StyledMapContainerProps>`
  width: 100%;
  height: 100vh;

  .gm-style iframe + div {
    border: ${({ isTabbing }) =>
      isTabbing ? `2px solid ${blue}` : 'none !important'};
  }
`;

export { StyledMapContainer };
