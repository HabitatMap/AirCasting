import styled, { css, keyframes } from "styled-components";

interface MarkerProps {
  color: string;
  $opacity: number;
  $shouldPulse?: boolean;
}

const pulseAnimation = keyframes`
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(2.0);
    opacity: 0.5;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
`;

const MarkerContainer = styled.div`
  display: flex;
  position: absolute;
  // To match the position of the marker with the center of the shadow circle
  top: -1rem;
  left: -1rem;
  width: 2rem;
  height: 2rem;
  cursor: pointer;
  z-index: 100;
  pointer-events: auto;
`;

const DataContainer = styled.div`
  min-width: 2rem;
  height: 2rem;
  display: flex;
  position: absolute;
  /* //To calculate top position: ShadowCircleHeight/2- DataContainerHeight/2
  top: 1rem;
  //To calculate this position: ShadowCircleWidth/2-(MarkerCircleWidth/2+MarkerCirclePaddingLeft)
  left: 0.9rem; */
  border-radius: 1.5rem;
  padding: 0.5rem 0.5rem 0.5rem 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  pointer-events: none;
`;

const MarkerCircle = styled.div<MarkerProps>`
  width: 1.2rem;
  height: 1.2rem;
  border-radius: 50%;
  background-color: ${(props) => props.color};
  pointer-events: none;
  opacity: ${(props) => props.$opacity};
  animation: ${(props) =>
    props.$shouldPulse
      ? css`
          ${pulseAnimation} 2s infinite
        `
      : "none"};
`;

export { DataContainer, MarkerCircle, MarkerContainer };
