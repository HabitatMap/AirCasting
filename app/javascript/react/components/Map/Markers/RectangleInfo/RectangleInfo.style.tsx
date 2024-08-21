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
  position: absolute;
`;

const ShadowCircle = styled.div<RectangleInfoProps>`
  width: 5rem;
  height: 5rem;
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
  transform: translate(-25%, -25%);
`;

const DataContainer = styled.div<RectangleInfoProps>`
  background-color: ${white};
  border: 1px solid ${(props) => props.$color};
  border-radius: 2rem;
  padding: 1rem;
  z-index: 20;
`;

const RectangleInfoText = styled.div`
  color: ${gray400};
  font-size: 1.4rem;
  font-weight: 400;
  pointer-events: none;
  display: flex;
  flex-direction: column;
`;

const RectangleCircle = styled.div<RectangleInfoProps>`
  width: 1rem;
  height: 1rem;
  border-radius: 50%;
  background-color: ${(props) => props.$color};
  pointer-events: none;
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
