import styled from "styled-components";

import { gray100, gray400 } from "../../../../../assets/styles/colors";
import media from "../../../../../utils/media";

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
  padding-bottom: 3rem;
  @media (${media.smallDesktop}) {
    padding-bottom: 0;
    width: 33.33%;
  }
`;

const MonthName = styled.span`
  font-size: 16px;
  letter-spacing: 6px;
  text-transform: uppercase;
  font-weight: 600;
  color: ${gray400};
  padding: 0.5rem;
  line-height: 120%;
  text-align: center;
  background-color: ${gray100};
  margin-bottom: 2.5rem;

  @media (${media.smallDesktop}) {
    font-size: 24px;
    border-radius: 10px;
    letter-spacing: 0;
    text-transform: none;
  }
`;

const MonthContent = styled.div`
  display: flex;
  flex-direction: column;
`;

export { Week, Month, MonthName, MonthContent };
