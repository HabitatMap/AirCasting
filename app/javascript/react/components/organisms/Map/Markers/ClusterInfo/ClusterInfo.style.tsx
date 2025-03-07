import styled from "styled-components";
import { gray400, white } from "../../../../../assets/styles/colors";

interface ClusterInfoContainerProps {
  $color: string;
  $top: number;
  $left: number;
  $isMobile?: boolean;
  $visible?: boolean;
  $loading?: boolean;
}

interface ClusterInfoProps {
  $color: string;
  $isMobile?: boolean;
  $loading?: boolean;
}

const ClusterInfoContainer = styled.div<ClusterInfoContainerProps>`
  display: grid;
  position: absolute;
  gap: 0.5rem;
  width: fit-content;
  z-index: 100;

  top: ${(props) => `${props.$top}px`};
  left: ${(props) => `${props.$left}px`};
  padding: ${(props) => (props.$loading ? "0.1rem 0" : "0")};
  height: ${(props) => (props.$isMobile ? "auto" : "2.8rem")};
  ${(props) =>
    props.$isMobile
      ? props.$loading
        ? "transform: translate(-12%, -45%);"
        : "transform: translate(-15%, -45%);"
      : props.$loading
      ? "transform: translate(-15%, -50%);"
      : "transform: translate(-6%, -52%);"}

  opacity: ${(props) => (props.$visible ? 1 : 0)};
  transition: opacity 0.3s ease-in-out, transform 0.3s ease-in-out;
`;

const ShadowCircle = styled.div<ClusterInfoProps>`
  width: ${(props) => (props.$isMobile ? "5rem" : "5rem")};
  height: ${(props) => (props.$isMobile ? "5rem" : "5rem")};
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

  ${(props) =>
    props.$isMobile
      ? "transform: translate(-15%, -10%);"
      : "transform: translate(-20%, -25%);"}
`;

const DataContainer = styled.div<ClusterInfoProps>`
  display: flex;
  height: 2.8rem;
  border-radius: 1.5rem;
  padding: 0.5rem;
  box-shadow: 0.125rem 0.125rem 0.25rem 0 rgba(76, 86, 96, 0.1);
  align-items: center;
  gap: 0.25rem;
  pointer-events: auto;
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
  width: ${(props) => (props.$loading ? "1rem" : "2rem")};
  height: ${(props) => (props.$loading ? "1rem" : "2rem")};
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

const MobileDataContainer = styled(DataContainer)`
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: flex-start;
  border-radius: 2rem;
  gap: 0.8rem;
  height: auto;
  padding: 0.6rem 1.6rem;
  z-index: 20;
  pointer-events: auto;
`;

const MobileClusterInfoText = styled(ClusterInfoText)`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.2rem;
`;

const MobileClusterInfoColorText = styled(ClusterInfoColorText)`
  font-weight: bold;
`;

export {
  ClusterCircle,
  ClusterInfoBoldText,
  ClusterInfoColorText,
  ClusterInfoContainer,
  ClusterInfoDataAndZoomIn,
  ClusterInfoText,
  DataContainer,
  MobileClusterInfoColorText,
  MobileClusterInfoText,
  MobileDataContainer,
  ShadowCircle,
};
