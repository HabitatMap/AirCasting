import styled from "styled-components";

import { gray400, white } from "../../../../assets/styles/colors";

interface RectangleInfoProps {
  $color: string;
}

const RectangleInfoContainer = styled.div`
  display: grid;
  position: absolute;
  left: -21.5px;
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
};
