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
  top: -10px;
  left: -20px;
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
  display: flex;
  flex-direction: column;
  font-size: 1.4rem;
  font-weight: 400;
  padding: 1rem;
  z-index: 20;
`;

const RectangleInfoHeader = styled.span`
  display: flex;
  align-items: center;
  margin-bottom: 2px;
`;

const RectangleCircle = styled.div<RectangleInfoProps>`
  background-color: ${(props) => props.$color};
  border-radius: 50%;
  height: 1rem;
  margin: 0rem 0.5rem 0rem 0rem;
  width: 1rem;
`;

const RectangleInfoColorText = styled.span<RectangleInfoProps>`
  color: ${(props) => props.$color};
  font-size: 1.4rem;
  font-weight: 400;
`;

const RectangleInfoBoldText = styled.span`
  color: ${gray400};
  font-weight: 700;
  font-size: 1.4rem;
  pointer-events: none;
  white-space: nowrap;
  margin: 0rem 0.5rem 0rem 0rem;
`;

const RectangleInfoText = styled.span`
  display: flex;
  flex-direction: row;
`;

export {
  DataContainer,
  RectangleCircle,
  RectangleInfoBoldText,
  RectangleInfoColorText,
  RectangleInfoContainer,
  RectangleInfoHeader,
  RectangleInfoText,
  ShadowCircle,
};
