import styled from "styled-components";

import { gray100, gray400 } from "../../../../../assets/styles/colors";

interface DayProps {
  $color?: string;
}

interface LabelProps {
  $isVisible: boolean;
  $isGrayedOut?: boolean;
}

const CalendarCell = styled.div`
  width: calc(100% / 7);
  padding: 4px;
`;

const Day = styled(CalendarCell)<DayProps>`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  //TODO: Ask Iwona about the opacity
  background-color: ${(props) => props.$color};
  border-radius: 5px;
`;

const DayNumber = styled.span<LabelProps>`
  font-size: 12px;
  text-align: end;
  display: ${(props) => (props.$isVisible ? "block" : "none")};
  color: ${(props) => (props.$isGrayedOut ? gray100 : gray400)};
  opacity: 50%;
`;

const Value = styled.div<LabelProps>`
  font-size: 0.8vw;
  font-weight: 600;
  text-align: start;
  display: ${(props) => (props.$isVisible ? "block" : "none")};
  color: ${gray400};
  padding-top: 0.45rem;
`;

export { Day, DayNumber, Value, CalendarCell };
