import styled from "styled-components";
import { gray400, white } from "../../../../assets/styles/colors";

interface ClusterInfoContainerProps {
  $color: string;
  $top: number;
  $left: number;
}

interface ClusterInfoProps {
  $color: string;
}

const ClusterInfoContainer = styled.div<ClusterInfoContainerProps>`
  display: grid;
  position: absolute;
  gap: 0.5rem;
  width: fit-content;
  cursor: pointer;
  z-index: 100;
  pointer-events: auto;
  top: ${(props) => `${props.$top}px`};
  left: ${(props) => `${props.$left}px`};
  transform: translate(-6%, -100%);
  height: 2.8rem;
`;

const ShadowCircle = styled.div<ClusterInfoProps>`
  height: 5rem;
  width: 5rem;
  position: absolute;
  border-radius: 50%;
  z-index: 10;
  background: radial-gradient(
    circle at center,
    ${(props) => props.$color} 0%,
    ${(props) => props.$color} 30%,
    transparent 100%
  );
  filter: blur(5px);
  pointer-events: none;
  transform: translate(-20%, -25%);
`;

const DataContainer = styled.div<ClusterInfoProps>`
  display: flex;
  height: 2.8rem;
  border-radius: 1.5rem;
  padding: 0.5rem;
  box-shadow: 0.125rem 0.125rem 0.25rem 0 rgba(76, 86, 96, 0.1);
  align-items: center;
  gap: 0.25rem;
  pointer-events: none;
  border: 1px solid ${(props) => props.$color};
  background-color: ${white};
`;

const ClusterInfoDataAndZoomIn = styled.div`
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.5rem;
  pointer-events: auto;
  z-index: 20;
`;

const ClusterCircle = styled.div<ClusterInfoProps>`
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background-color: ${(props) => props.$color};
  pointer-events: none;
`;

const ClusterInfoText = styled.div`
  color: ${gray400};
  font-size: 1.4rem;
  font-weight: 400;
  pointer-events: none;
  white-space: nowrap;
`;

const ClusterInfoBoldText = styled.span`
  color: ${gray400};
  font-weight: 700;
  font-size: 1.4rem;
  pointer-events: none;
  white-space: nowrap;
`;

const ClusterInfoColorText = styled.span<ClusterInfoProps>`
  color: ${(props) => props.$color};
  font-size: 1.4rem;
  font-weight: 400;
  pointer-events: none;
  white-space: nowrap;
`;

export {
  ClusterCircle,
  ClusterInfoBoldText,
  ClusterInfoColorText,
  ClusterInfoContainer,
  ClusterInfoDataAndZoomIn,
  ClusterInfoText,
  DataContainer,
  ShadowCircle,
};
