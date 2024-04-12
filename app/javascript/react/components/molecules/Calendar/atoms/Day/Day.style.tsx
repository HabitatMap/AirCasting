import styled from "styled-components";

import { gray100, gray400 } from "../../../../../assets/styles/colors";
import media from "../../../../../utils/media";

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
  aspect-ratio: 1;
`;

const Day = styled(CalendarCell)<DayProps>`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  //TODO: Ask Iwona about the opacity
  background-color: ${(props) => props.$color};

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

const Value = styled.div<LabelProps>`
  font-size: 18px;
  font-weight: 600;
  text-align: start;
  display: ${(props) => (props.$isVisible ? "block" : "none")};
  color: ${gray400};
  padding-top: 11%;

  @media (${media.smallDesktop}) {
    font-size: 28px;
  }
  @media (${media.desktop}) {
    font-size: 16px;
  }
`;

export { Day, DayNumber, Value, CalendarCell };
