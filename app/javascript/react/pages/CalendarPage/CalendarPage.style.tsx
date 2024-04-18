import styled from "styled-components";

import { gray100 } from "../../assets/styles/colors";
import { H3 } from "../../components/Typography";
import { media } from "../../utils/media";

const CalendarPageLayout = styled.div`
  display: flex;
  justify-content: center;
  background-color: ${gray100};

  @media ${media.smallDesktop} {
  padding: 15px;
`;

const StationDataContainer = styled.div`
  box-shadow: 0px 5px 20px 2px rgba(0, 0, 0, 0.1);
  width: 100vw;
  max-width: 1600px;
  min-height: 100vh;
  margin: 20px 0;

  @media ${media.desktop} {
    margin: 20px 5vw;
  }
`;

const Heading = styled(H3)`
  padding-bottom: 20px;
  font-weight: 700;
  font-size: 22px;

  @media ${media.smallDesktop} {
    font-size: 28px;
    font-weight: 500;
  }
`;

export { StationDataContainer, CalendarPageLayout, Heading };
