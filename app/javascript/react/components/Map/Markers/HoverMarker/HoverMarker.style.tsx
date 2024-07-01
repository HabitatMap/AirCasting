import styled from "styled-components";

interface MarkerProps {
  $fixedSessionTypeSelected: boolean;
}

const MarkerCircle = styled.svg<MarkerProps>`
  width: 1.5rem;
  height: 1.5rem;
  position: absolute;
  top: ${(props) => (props.$fixedSessionTypeSelected ? "-0.5rem" : "0")};
  left: ${(props) => (props.$fixedSessionTypeSelected ? "-0.35rem" : "0")};
  transform: translate(-50%, -50%);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  will-change: transform;
`;

export { MarkerCircle };
