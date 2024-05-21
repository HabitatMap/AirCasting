import styled from "styled-components";
import { media } from "../../../utils/media";
import { white } from "../../../assets/styles/colors";
import { H3 } from "../../Typography";

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

  @media ${media.desktop} {
    display: none;
  }
`;

const DesktopSwipeLeftContainer = styled.div`
  display: none;
  position: absolute;
  top: 50%;
  transform: translateY(-50%);

  @media (${media.desktop}) {
    display: flex;
    left: 3rem;
  }
`;

const DesktopSwipeRightContainer = styled.div`
  display: none;
  position: absolute;
  top: 50%;
  transform: translateY(-50%);

  @media (${media.desktop}) {
    display: flex;
    right: 3rem;
  }
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

const RedErrorMessage = styled.span`
  color: red;
  padding: 0 0 1rem 0;
  min-height: 2rem;
  display: block;
  visibility: hidden;
`;

export {
  DateField,
  ThreeMonths,
  CalendarContainer,
  MobileSwipeContainer,
  DesktopSwipeLeftContainer,
  DesktopSwipeRightContainer,
  RedErrorMessage
};
