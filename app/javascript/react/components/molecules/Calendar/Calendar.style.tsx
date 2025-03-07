import styled from "styled-components";
import { white } from "../../../assets/styles/colors";
import { media } from "../../../utils/media";
import { H3 } from "../../atoms/Typography";

const ThreeMonths = styled.div`
  display: flex;
  justify-content: center;
  gap: 2rem;
  flex-wrap: wrap;

  @media (${media.desktop}) {
    flex-wrap: nowrap;
  }
`;

const MobileSwipeContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-direction: row;
  padding: 1.5rem 0;
`;

const DesktopSwipeLeftContainer = styled.div`
  position: absolute;
  display: flex;
  left: 3rem;
  top: 25rem;
  transform: translateY(-50%);
`;

const DesktopSwipeRightContainer = styled.div`
  position: absolute;
  display: flex;
  right: 3rem;
  top: 25rem;
  transform: translateY(-50%);
`;

const DateField = styled(H3)`
  display: flex;
  align-items: center;

  span {
    margin: 0 1.5rem;
  }
`;

const CalendarContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: 1.5rem;
  background: ${white};
  position: relative;

  @media (${media.desktop}) {
    padding: 3.5rem 10rem;
  }
`;

export {
  CalendarContainer,
  DateField,
  DesktopSwipeLeftContainer,
  DesktopSwipeRightContainer,
  MobileSwipeContainer,
  ThreeMonths,
};
