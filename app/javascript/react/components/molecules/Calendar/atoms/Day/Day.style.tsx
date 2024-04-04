import styled from "styled-components";

import { gray100, gray400 } from "../../../../../assets/styles/colors";

interface dayProps {
  $color?: string;
  $hasBackground: boolean;
  $isCurrentMonth: boolean;
}

interface labelProps {
  $isVisible: boolean;
  $isGrayedOut?: boolean;
}

const CalendarCell = styled.div`
  width: 50px;
  height: 50px;
  padding: 4px;
`;

const Day = styled(CalendarCell)<dayProps>`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  //TODO: Ask Iwona about the opacity
  background-color: ${(props) =>
    props.$hasBackground ? props.color : "transparent"};
  border-radius: 5px;
`;

const DayNumber = styled.span<labelProps>`
  font-size: 12px;
  text-align: end;
  display: ${(props) => (props.$isVisible ? "block" : "none")};
  color: ${(props) => (props.$isGrayedOut ? gray100 : gray400)};
  opacity: 50%;
`;

const Value = styled.div<labelProps>`
  font-size: 18px;
  font-weight: 600;
  text-align: start;
  display: ${(props) => (props.$isVisible ? "block" : "none")};
  color: ${gray400};
`;

export { Day, DayNumber, Value, CalendarCell };
