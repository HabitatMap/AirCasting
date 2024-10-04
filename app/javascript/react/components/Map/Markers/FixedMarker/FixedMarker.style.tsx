import styled, { keyframes } from "styled-components";
import { gray400, white } from "../../../../assets/styles/colors";

interface FixedMarkerContainerProps {
  $color: string;
  $top: number;
  $left: number;
  $visible?: boolean;
}
interface FixedMarkerCircleProps {
  $color: string;
  $shouldPulse: boolean;
  $isSelected: boolean;
}

interface DataContainerProps {
  $color: string;
}

// add @keyframes pulse-animation {
//             0% { transform: scale(1); opacity: 1; }
//             50% { transform: scale(${maxScaleFactor}); opacity: 0.9; }
//             100% { transform: scale(1); opacity: 1; }

keyframes` pulse-animation {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(2); opacity: 0.9; }
  100% { transform: scale(1); opacity: 1; }
}`;

const FixedMarkerContainer = styled.div<FixedMarkerContainerProps>`
  display: grid;
  position: absolute;
  gap: 0.5rem;
  width: fit-content;
  z-index: 100001;
  top: ${(props) => `${props.$top}px`};
  left: ${(props) => `${props.$left}px`};

  height: 0.4rem;
  transform: translate(-6%, -100%);
  opacity: ${(props) => (props.$visible ? 1 : 0)};
  transition: opacity 0.3s ease-in-out, transform 0.3s ease-in-out;
  pointer-events: cursor;
`;

const FixedMarkerCircle = styled.div<FixedMarkerCircleProps>`
  width: 0.06rem;
  height: 0.06rem;
  border-radius: 50%;
  z-index: 10;
  background: radial-gradient(
    circle at center,
    ${(props) => props.$color} 0%,
    ${(props) => props.$color} 30%,
    transparent 100%
  );
  filter: blur(5px);
  animation: ${(props) =>
    props.$shouldPulse ? "pulse - animation 2s infinite" : ""};
  transform: translate(-50%, -50%);
`;

const DataContainer = styled.div<DataContainerProps>`
  display: flex;
  height: 2.8rem;
  border-radius: 1.5rem;
  background-color: ${(props) => props.$color};
  padding: 0 1rem;
  align-items: center;
`;

const FixedMarkerDot = styled.div<DataContainerProps>`
  width: 0.2rem;
  height: 0.2rem;
  border-radius: 50%;
  background-color: ${(props) => props.$color};
  z-index: 20;
  pointer-events: none;
`;

const FixedMarkerInfo = styled.div`
  display: flex;
  height: 0.4rem;
  border-radius: 0.2rem;
  background-color: ${white};
  color: ${gray400};
  padding: 0 0.5rem;
  align-items: center;
  font-size: 0.2rem;
`;

export {
  DataContainer,
  FixedMarkerContainer,
  FixedMarkerCircle,
  FixedMarkerDot,
  FixedMarkerInfo,
};
