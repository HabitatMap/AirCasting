import styled from "styled-components";

import { H4 } from "../../../../Typography";

const DayNamesHeaderContainer = styled.div`
  display: flex;
  justify-content: space-between;
`;

const DayName = styled(H4)`
  height: auto;
  text-align: center;
  text-transform: uppercase;
  font-size: 14px;
  margin-bottom: 15px;
`;

export { DayNamesHeaderContainer, DayName };
