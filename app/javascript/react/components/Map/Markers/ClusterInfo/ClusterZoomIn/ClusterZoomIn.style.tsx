import styled from "styled-components";
import { white } from "../../../../../assets/styles/colors";

interface ZoomInContainerProps {
  $isMobile?: boolean;
}

const ZoomInContainer = styled.div<ZoomInContainerProps>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: ${(props) => (props.$isMobile ? "2.8rem" : "4.2rem")};
  height: 2.8rem;
  border-radius: 25px;
  background-color: ${white};
  cursor: pointer;
  ${(props) => !props.$isMobile && "box - shadow: 2px 2px 4px 0px #4c56601a;"}
  z-index: 100;
`;

export { ZoomInContainer };
