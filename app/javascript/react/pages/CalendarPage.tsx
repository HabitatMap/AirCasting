import React from "react";

import styled from "styled-components";

import { Navbar } from "../components/Navbar/Navbar";
import { CalendarStationHeader } from "../components/molecules/CalendarStationHeader/CalendarStationHeader";
import { Graph } from "../components/Graph";
import { grey100, white } from "../assets/styles/colors";

const PageLayout = styled.div`
  background-color: ${grey100};
  height: 100vh;
  padding: 20px 50px;
  display: flex;
  justify-content: center;
`;

const StationDataContainer = styled.div`
  box-shadow: 0px 5px 20px 2px rgba(0, 0, 0, 0.1);
  background: ${white};
  width: 90vw;
  max-width: 1600px;
`;

const CalendarPage = () => {
  return (
    <>
      <Navbar />
      <PageLayout>
        <StationDataContainer>
          <CalendarStationHeader
            stationName="White Plains, New York-Northern New Jersey-London"
            profile="Tim Cain"
            sensor="Government Data USEPA"
            lastUpdate="18:00, Sep 1 2023"
            streamData={{
              day: "Jun 12",
              value: 12,
              parameter: "PM2.5 µg/m",
            }}
          />
          <Graph />
        </StationDataContainer>
      </PageLayout>
    </>
  );
};

export { CalendarPage };
