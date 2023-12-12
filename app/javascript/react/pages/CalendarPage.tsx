import React from "react";
import styled from "styled-components";

import { Navbar } from "../components/Navbar/Navbar";
import { Graph } from "../components/Graph";
import { dirtyWhite, white } from "../assets/styles/colors";

const PageLayout = styled.div`
  background-color: ${dirtyWhite};
  height: 100vh;
  padding: 30px;
`;

const StationDataContainer = styled.div`
  padding: 20px;
  box-shadow: 0px 5px 20px 2px rgba(0, 0, 0, 0.1);
  background: ${white};
`;

import * as S from "./CalendarPage.style";
import { ThresholdConfigurator } from "../components/ThresholdConfigurator/ThresholdConfigurator";

const CalendarPage = () => {
  return (
    <>
      <Navbar />
      <PageLayout>
        <S.CalendarPageContainer>
          <ThresholdConfigurator />
          <StationDataContainer>
            <Graph />
          </StationDataContainer>
        </S.CalendarPageContainer>
      </PageLayout>
    </>
  );
};

export { CalendarPage };
