import styled from "styled-components";

import { H4 } from "../../../../Typography";
import { media } from "../../../../../utils/media";

const DayNamesHeaderContainer = styled.div`
  display: flex;
  justify-content: space-between;
`;

const DayName = styled(H4)`
  height: auto;
  width: 100%;
  text-align: center;
  text-transform: uppercase;
  font-size: 10px;
  margin-bottom: 15px;
  @media (${media.smallDesktop}) {
    font-size: 14px;
  }
`;

export { DayNamesHeaderContainer, DayName };
