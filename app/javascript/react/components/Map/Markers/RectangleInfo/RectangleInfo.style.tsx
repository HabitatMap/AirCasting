import styled from "styled-components";

import { gray400, white } from "../../../../assets/styles/colors";

interface RectangleInfoContainerProps {
  $color: string;
  $isMobile?: boolean;
  $visible?: boolean;
}

interface RectangleInfoProps {
  $color: string;
  $isMobile?: boolean;
}

const RectangleInfoContainer = styled.div<RectangleInfoContainerProps>`
  display: grid;
  pointer-events: auto;

  position: absolute;
  transition: opacity 0.3s ease-in-out, transform 0.3s ease-in-out;
`;

const ShadowCircle = styled.div<RectangleInfoProps>`
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

const DataContainer = styled.div<RectangleInfoProps>`
  display: grid;
  height: auto;
  border-radius: 2rem;
  padding: 0.4rem 1.6rem;
  box-shadow: 0.125rem 0.125rem 0.25rem 0 rgba(76, 86, 96, 0.1);
  align-items: flex-start;
  gap: 0.8rem;
  pointer-events: auto;
  border: 1px solid ${(props) => props.$color};
  background-color: ${white};
  z-index: 20;
  grid-template-columns: auto 1fr;
`;

const RectangleCircle = styled.div<RectangleInfoProps>`
  width: 1rem;
  height: 1rem;
  border-radius: 50%;
  background-color: ${(props) => props.$color};
  pointer-events: none;
`;

const RectangleInfoText = styled.div`
  color: ${gray400};
  font-size: 1.4rem;
  font-weight: 400;
  pointer-events: none;
  display: flex;
  flex-direction: column;
`;

const RectangleInfoBoldText = styled.span`
  color: ${gray400};
  font-weight: 700;
  font-size: 1.4rem;
  pointer-events: none;
  white-space: nowrap;
`;

const RectangleInfoColorText = styled.span<RectangleInfoProps>`
  color: ${(props) => props.$color};
  font-size: 1.4rem;
  font-weight: 400;
  pointer-events: none;
  white-space: nowrap;
  flex-direction: row;
`;

export {
  DataContainer,
  RectangleCircle,
  RectangleInfoBoldText,
  RectangleInfoColorText,
  RectangleInfoContainer,
  RectangleInfoText,
  ShadowCircle,
};
