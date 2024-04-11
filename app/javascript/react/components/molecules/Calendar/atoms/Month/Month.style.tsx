import styled from "styled-components";

import { gray100, gray400 } from "../../../../../assets/styles/colors";

const DAY_GAP = "10px";

const Week = styled.div`
  display: flex;
  gap: ${DAY_GAP};
  width: 100%;
  height: 100%;
`;

const Month = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`;

const MonthName = styled.span`
  font-size: 24px;
  font-weight: 600;
  color: ${gray400};
  padding: 0.5rem;
  line-height: 120%;
  text-align: center;
  background-color: ${gray100};
  border-radius: 10px;
  margin-bottom: 2.5rem;
`;

const MonthContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${DAY_GAP};
`;

export { Week, Month, MonthName, MonthContent };
