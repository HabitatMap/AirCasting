import styled from "styled-components";

import { grey100, grey400 } from "../../assets/styles/colors";

interface dayProps {
  $color?: string;
  $hasBackground: boolean;
  $isCurrentMonth: boolean;
}

interface labelProps {
  $isVisible: boolean;
  $isGrayedOut?: boolean;
}

const DAY_GAP = "6px";

const Day = styled.div<dayProps>`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: 50px;
  height: 50px;
  padding: 4px;
  //TODO: Ask Iwona about the opacity
  background-color: ${(props) =>
    props.$hasBackground ? props.color : "transparent"};
  border-radius: 5px;
`;

const DayNumber = styled.span<labelProps>`
  font-size: 10px;
  text-align: end;
  display: ${(props) => (props.$isVisible ? "block" : "none")};
  color: ${(props) => (props.$isGrayedOut ? grey100 : grey400)};
`;

const Value = styled.div<labelProps>`
  font-size: 16px;
  font-weight: 600;
  text-align: start;
  display: ${(props) => (props.$isVisible ? "block" : "none")};
`;

const Week = styled.div`
  display: flex;
  gap: ${DAY_GAP};
  width: 100%;
  height: 100%;
`;

const Month = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${DAY_GAP};
`;

const MonthName = styled.span`
  font-size: 24px;
  font-weight: 600;
  color: ${grey400};
  padding: 8px;
  line-height: 120%;
  text-align: center;
  background-color: ${grey100};
  border-radius: 10px;
`;

const ThreeMonths = styled.div`
  display: flex;
  justify-content: center;
  gap: 40px;
`;

export { Day, DayNumber, Week, Value, Month, MonthName, ThreeMonths };
