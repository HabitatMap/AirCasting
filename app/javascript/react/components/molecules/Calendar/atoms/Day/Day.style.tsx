import styled from "styled-components";

import { gray100, gray400 } from "../../../../../assets/styles/colors";
import { media } from "../../../../../utils/media";

interface DayProps {
  $color?: string;
  $isSelected?: boolean;
  $borderColor?: string;
  $hasValue?: boolean;
}

interface LabelProps {
  $isVisible: boolean;
  $isGrayedOut?: boolean;
}

const CalendarCell = styled.div`
  flex: 1 0 auto;
  padding: 4px;
  aspect-ratio: 1;
  position: relative;
  height: calc(100% - 9px);
  width: calc(100% / 7 - 9px);
  max-width: calc(100% / 7 - 9px);
  min-width: 0;
`;

const Day = styled(CalendarCell)<DayProps>`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  text-align: center;
  margin: 0 0 0.6rem 0;
  background-color: ${(props) => props.$color};
  width: 100%;
  cursor: ${(props) => (props.$hasValue ? "pointer" : "default")};
  transition: all 0.2s ease-in-out;
  border: 2px solid transparent;

  ${(props) =>
    props.$isSelected &&
    `
    border: 1px solid ${props.$borderColor || gray400};
    box-shadow: 0 0 0 1px ${props.$borderColor || gray400};
  `}
  ${(props) =>
    props.$hasValue &&
    `
    &:hover {
      transform: scale(1.05);
      border: 2px solid ${props.$borderColor};
    }
  `}

  @media (${media.smallDesktop}) {
    border-radius: 5px;
  }
`;

const DayNumber = styled.span<LabelProps>`
  font-size: 12px;
  text-align: end;
  display: ${(props) => (props.$isVisible ? "block" : "none")};
  color: ${(props) => (props.$isGrayedOut ? gray100 : gray400)};
  opacity: 50%;

  @media (${media.smallDesktop}) {
    font-size: 18px;
  }
  @media (${media.desktop}) {
    font-size: 10px;
  }
`;

const ValueContainer = styled.div<LabelProps>`
  font-size: 3.8vw;
  font-weight: 600;
  text-align: start;
  display: ${(props) => (props.$isVisible ? "block" : "none")};
  color: ${gray400};
  padding-top: 11%;
  position: relative;
  height: 100%;
  display: flex;
  align-items: flex-end;
  overflow: hidden;

  @media (${media.smallDesktop}) {
    font-size: 3.2vw;
  }
  @media (${media.desktop}) {
    font-size: 0.9vw;
  }
`;

const Value = styled.div`
  width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export { CalendarCell, Day, DayNumber, Value, ValueContainer };
