import React from "react";

import styled from "styled-components";

import { Navbar } from "../components/Navbar/Navbar";
import { Graph } from "../components/Graph";
import { dirtyWhite, white } from "../assets/styles/colors";
import SegmentedPicker from "../components/SegmentedPickerButtons/SegmentedPickerButtons";

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

const CalendarPage = () => {
  return (
    <>
      <Navbar />
      <PageLayout>
        <StationDataContainer>
          <Graph />
        </StationDataContainer>
      </PageLayout>
    </>
  );
};

export { CalendarPage };
