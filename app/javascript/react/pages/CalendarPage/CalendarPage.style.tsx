import styled from "styled-components";

import { gray100, white } from "../../assets/styles/colors";
import { H3 } from "../../components/Typography";
import media from "../../utils/media";

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

const Heading = styled(H3)`
  padding-bottom: 30px;
  font-weight: 700;

  @media ${media.desktop} {
    font-size: 28px;
    font-weight: 500;
  }
`;

export { StationDataContainer, CalendarPageLayout, Heading };
