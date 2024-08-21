import styled from "styled-components";

import { gray400, white } from "../../../../assets/styles/colors";

interface RectangleInfoProps {
  $color: string;
}

const RectangleInfoContainer = styled.div`
  display: grid;
  position: absolute;
  top: -10px;
  left: -20px;
`;

const ShadowCircle = styled.div<RectangleInfoProps>`
  background: radial-gradient(
    circle at center,
    ${(props) => props.$color} 0%,
    ${(props) => props.$color} 30%,
    transparent 100%
  );
  border-radius: 50%;
  filter: blur(5px);
  height: 5rem;
  position: absolute;
  transform: translate(-25%, -25%);
  width: 5rem;
  z-index: 10;
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
  align-items: center;
  display: flex;
  gap: 5px;
  margin-bottom: 4px;
`;

const RectangleCircle = styled.div<RectangleInfoProps>`
  background-color: ${(props) => props.$color};
  border-radius: 50%;
  height: 1rem;
  width: 1rem;
`;

const RectangleInfoColorText = styled.span<RectangleInfoProps>`
  color: ${(props) => props.$color};
`;

const RectangleInfoText = styled.span`
  display: flex;
  flex-direction: row;
`;

const RectangleInfoBoldText = styled.span`
  color: ${gray400};
  font-weight: 700;
  font-size: 1.4rem;
  pointer-events: none;
  white-space: nowrap;
  margin: 0rem 0.5rem 0rem 0rem;
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
