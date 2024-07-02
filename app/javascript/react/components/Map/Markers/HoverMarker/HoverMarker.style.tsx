import styled from "styled-components";
import { blue } from "../../../../assets/styles/colors";

interface MarkerProps {
  $fixedSessionTypeSelected: boolean;
}

const MarkerCircle = styled.div<MarkerProps>`
  width: 1.6rem;
  height: 1.6rem;
  position: absolute;
  top: ${(props) => (props.$fixedSessionTypeSelected ? "-0.5rem" : "0")};
  left: ${(props) => (props.$fixedSessionTypeSelected ? "-0.35rem" : "0")};
  transform: translate(-50%, -50%);
  background-color: ${blue};
  border-radius: 50%;
`;

export { MarkerCircle };
