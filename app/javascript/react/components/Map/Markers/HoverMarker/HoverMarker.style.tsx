import styled from "styled-components";
import { blue } from "../../../../assets/styles/colors";

const MarkerContainer = styled.div`
  display: flex;
  position: absolute;
  top: -1.25rem;
  left: -1.2rem;
  width: 11.5rem;
  height: 5rem;
  cursor: pointer;
  z-index: 100;
  pointer-events: auto;
`;

const MarkerCircle = styled.div`
  width: 1.6rem;
  height: 1.6rem;
  border-radius: 50%;
  background-color: ${blue};
  pointer-events: none;
`;

export { MarkerCircle, MarkerContainer };
