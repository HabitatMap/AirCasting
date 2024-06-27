import styled from "styled-components";
import { blue } from "../../../../assets/styles/colors";

interface MarkerProps {
  $fixedSessionTypeSelected: boolean;
}

const MarkerCircle = styled.div<MarkerProps>`
  width: 1.6rem;
  height: 1.6rem;
  top: ${(props) => (props.$fixedSessionTypeSelected ? "-0.5rem" : "0")};
  left: ${(props) => (props.$fixedSessionTypeSelected ? "-0.5rem" : "0")};
  border-radius: 50%;
  background-color: ${blue};
  position: absolute;
  transform: translate(-50%, -50%);
`;

export { MarkerCircle };
