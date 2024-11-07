import styled from "styled-components";

import { gray400, white } from "../../../../assets/styles/colors";

interface RectangleInfoProps {
  $color: string;
  $loading?: boolean;
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
  padding: ${(props) => (props.$loading ? "0.1rem 0.5rem" : "1rem")};
  z-index: 20;
`;

const RectangleInfoHeader = styled.span<Pick<RectangleInfoProps, "$loading">>`
  align-items: center;
  display: flex;
  gap: 5px;
  margin-bottom: ${(props) => (props.$loading ? "0.2rem" : "4px")};
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
  white-space: nowrap;
`;

const RectangleInfoBoldText = styled.span`
  color: ${gray400};
  font-weight: 700;
  margin: 0rem 0.5rem 0rem 0rem;
  white-space: nowrap;
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
