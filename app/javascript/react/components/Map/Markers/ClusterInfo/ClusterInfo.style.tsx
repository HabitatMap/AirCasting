import styled, { css, keyframes } from "styled-components";
import { gray400 } from "../../../../assets/styles/colors";
import { H4 } from "../../../Typography";

interface ClusterInfoProps {
  $color: string;
}

interface ClusterInfoShadowProps {
  $color: string;
  $shouldPulse?: boolean;
}

const pulseAnimation = keyframes`
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.5);
    opacity: 0.8;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
`;

const ClusterInfoContainer = styled.div<ClusterInfoProps>`
  display: flex;
  position: absolute;
  top: -2rem;
  left: -2rem;
  width: 8rem;
  height: 4rem;
  cursor: pointer;
  z-index: 100;
  pointer-events: auto;
  border: 1px solid ${(props) => props.$color};
`;

const ShadowCircle = styled.div<ClusterInfoShadowProps>`
  height: 4rem;
  width: 4rem;
  border-radius: 50%;
  background: radial-gradient(
    circle at center,
    ${(props) => props.$color} 0%,
    ${(props) => props.$color} 30%,
    transparent 100%
  );
  filter: blur(5px);
  pointer-events: none;
  animation: ${(props) =>
    props.$shouldPulse
      ? css`
          ${pulseAnimation} 2s infinite
        `
      : "none"};
`;

const DataContainer = styled.div`
  min-width: 8rem;
  height: 2rem;
  display: flex;
  position: absolute;
  //To calculate top position: ShadowCircleHeight/2- DataContainerHeight/2
  top: 1rem;
  //To calculate this position: ShadowCircleWidth/2-(MarkerCircleWidth/2+MarkerCirclePaddingLeft)
  left: 0.9rem;
  border-radius: 1.5rem;
  padding: 0.5rem;
  background-color: white;
  box-shadow: 0.125rem 0.125rem 0.25rem 0 rgba(76, 86, 96, 0.1);
  align-items: center;
  gap: 0.25rem;
  pointer-events: none;
`;

const ClusterCircle = styled.div<ClusterInfoProps>`
  width: 1.2rem;
  height: 1.2rem;
  border-radius: 50%;
  background-color: ${(props) => props.$color};
  pointer-events: none;
`;

const ClusterInfoText = styled(H4)`
  color: ${gray400};
  font-size: 1.2rem;
  font-weight: 400;
  pointer-events: none;
  white-space: nowrap;
`;

export {
  ClusterCircle,
  ClusterInfoContainer,
  ClusterInfoText,
  DataContainer,
  ShadowCircle,
};
