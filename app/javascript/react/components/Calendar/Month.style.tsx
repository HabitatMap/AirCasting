import styled from "styled-components";

import { gray100, gray400 } from "../../assets/styles/colors";

interface dayProps {
  color?: string;
  shouldColor: boolean;
  isCurrentMonth: boolean;
}

const Day = styled.div<dayProps>`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: 50px;
  height: 50px;
  padding: 4px;
  opacity: 0.8;
  background-color: ${(props) =>
    props.shouldColor ? props.color : "transparent"};
  border-radius: 5px;
`;

interface labelProps {
  shouldDisplay: boolean;
  isGrayedOut?: boolean;
}

const DayNumber = styled.label<labelProps>`
  font-size: 10px;
  text-align: end;
  display: ${(props) => (props.shouldDisplay ? "block" : "none")};
  color: ${(props) => (props.isGrayedOut ? gray100 : gray400)};
`;

const Value = styled.div<labelProps>`
  font-size: 16px;
  font-weight: bold;
  text-align: start;
  display: ${(props) => (props.shouldDisplay ? "block" : "none")};
`;

const Week = styled.div`
  display: flex;
  gap: 6px;
  width: 100%;
  height: 100%;
`;

const Month = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

//TO DO: change colors here after merge of threshold config where
//gray colors are defined
const MonthName = styled.div`
  font-size: 24px;
  font-weight: 600;
  color: #3e4449;
  padding: 8px;
  line-height: 120%;
  text-align: center;
  background-color: #f4f6f9;
  border-radius: 10px;
`;

const ThreeMonths = styled.div`
  display: flex;
  justify-content: center;
  gap: 40px;
`;

interface DayNamesProps {
  names: string[];
}

const DayNames = styled.div<DayNamesProps>`
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 0.14px;
  line-height: 1.2;
  text-transform: uppercase;
  color: gray400;
`;

export { Day, DayNumber, Week, Value, Month, MonthName, ThreeMonths, DayNames };
