import styled from "styled-components";
import media from "../../../utils/media";
import { white } from "../../../assets/styles/colors";

const ThreeMonths = styled.div`
  display: flex;
  justify-content: center;
  gap: 2rem;
  flex-wrap: wrap;

  @media (${media.desktop}) {
    flex-wrap: nowrap;
  }
`;

const CalendarContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: 1.5rem;
  background: ${white};

  @media (${media.desktop}) {
    padding: 3.5rem 10rem;
  }
`;

export { ThreeMonths, CalendarContainer };
