import styled from "styled-components";

import { grey100, grey400 } from "../../assets/styles/colors";

interface dayProps {
  color?: string;
  shouldColor: boolean;
  isCurrentMonth: boolean;
}

const Day = styled.div<dayProps>`
  display: flex;
  position: relative;
  width: 50px;
  height: 50px;
  padding: 4px;
  flex-shrink: 0;
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
  align-self: flex-start;
  display: ${(props) => (props.shouldDisplay ? "block" : "none")};
  color: ${(props) => (props.isGrayedOut ? grey100 : grey400)};
`;

const Value = styled.div<labelProps>`
  align-self: flex-end;
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

export { Day, DayNumber, Week, Value, Month };
