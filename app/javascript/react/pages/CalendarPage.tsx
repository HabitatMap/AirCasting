import React from "react";

import { Navbar } from "../components/Navbar/Navbar";
import { Graph } from "../components/Graph";
import { CalendarStationHeader } from "../components/molecules/CalendarStationHeader/CalendarStationHeader";
import { WeekView } from "../components/WeekView/WeekView";
import { thresholdsValues, weeklyData } from "../components/WeekView/WeeklyMockData";
import * as S from "./CalendarPage.style";

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
      <S.PageLayout>
        <S.StationDataContainer>
          <Graph />
        </S.StationDataContainer>
        <WeekView weeklyData={weeklyData} thresholdsValues={thresholdsValues} />
      </S.PageLayout>
    </>
  );
};

export { CalendarPage };
