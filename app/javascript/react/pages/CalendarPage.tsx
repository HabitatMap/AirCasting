import React from "react";

import styled from "styled-components";

import { Navbar } from "../components/Navbar/Navbar";
import { Graph } from "../components/Graph";
import { grey100, white100 } from "../assets/styles/colors";
import { CalendarStationHeader } from "../components/molecules/CalendarStationHeader/CalendarStationHeader";
import { WeekView } from "../components/WeekView/WeekView";
import { colorRanges, weeklyData } from "../components/WeekView/WeeklyMockData";

const PageLayout = styled.div`
  background-color: ${white100};
  height: 100vh;
  padding: 30px;
`;

const StationDataContainer = styled.div`
  box-shadow: 0px 5px 20px 2px rgba(0, 0, 0, 0.1);
  background: ${white100};
  width: 90vw;
  max-width: 1600px;
`;

const CalendarPage = () => {
  return (
    <>
      <Navbar />
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
      <PageLayout>
        <StationDataContainer>
          <Graph />
        </StationDataContainer>
        <WeekView weeklyData={weeklyData} colorRanges={colorRanges} />
      </PageLayout>
    </>
  );
};

export { CalendarPage };
