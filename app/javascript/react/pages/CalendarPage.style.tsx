import styled from "styled-components";

import { grey100, white } from "../assets/styles/colors";

const CalendarPageLayout = styled.div`
  display: flex;
  justify-content: center;
  background-color: ${grey100};
  padding: 30px;
`;

const StationDataContainer = styled.div`
  box-shadow: 0px 5px 20px 2px rgba(0, 0, 0, 0.1);
  background: ${white};
  width: 90vw;
  max-width: 1600px;
  margin: 20px 10vw;
  min-height: 100vh;
`;

export { StationDataContainer, CalendarPageLayout };
