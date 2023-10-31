import React from "react";

import { ThresholdsConfigurator } from "../components/ThresholdConfigurator/ThresholdConfigurator";
import { Navbar } from "../components/Navbar/Navbar";
import { Graph } from "../components/Graph";
import { CalendarStationHeader } from "../components/molecules/CalendarStationHeader/CalendarStationHeader";

import * as S from "./CalendarPage.style";

const initialThresholds = [1, 20, 40, 60, 100];
const CalendarPage = () => {
  return (
    <>
      <Navbar />
      <S.CalendarPageLayout>
        <S.StationDataContainer>
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
          <ThresholdsConfigurator initialThresholds={initialThresholds} />
          <Graph />
        </S.StationDataContainer>
      </S.CalendarPageLayout>
    </>
  );
};
export { CalendarPage };
