import styled from "styled-components";

import { gray100, white } from "../../assets/styles/colors";

const CalendarPageLayout = styled.div`
  display: flex;
  padding: 30px;
  justify-content: center;
  background-color: ${gray100};
`;

const StationDataContainer = styled.div`
  box-shadow: 0px 5px 20px 2px rgba(0, 0, 0, 0.1);
  background: ${white};
  width: 90vw;
  max-width: 1600px;
  min-height: 100vh;
  margin: 20px 10vw;
`;

export { StationDataContainer, CalendarPageLayout };
