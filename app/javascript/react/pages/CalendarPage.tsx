import React from "react";
import { useSelector } from "react-redux";

import { ThresholdsConfigurator } from "../components/ThresholdConfigurator";
import { Navbar } from "../components/Navbar/Navbar";
import { Graph } from "../components/Graph";
import { CalendarStationHeader } from "../components/molecules/CalendarStationHeader/CalendarStationHeader";
import Calendar from "../components/Calendar/Calendar";

import * as S from "./CalendarPage.style";
import { selectThreshold } from "../store/thresholdSlice";
import { WeekView } from "../components/WeekView/WeekView";
import { weeklyData } from "../components/WeekView/WeeklyMockData";
const CalendarPage = () => {
  const initialThresholds = useSelector(selectThreshold);

  return (
    <>
      <Navbar />
<<<<<<< HEAD
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
=======
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
          <Calendar />
>>>>>>> 8472c970 (Add three months view without logic)
          <Graph />
          <WeekView weeklyData={weeklyData} thresholdsValues={initialThresholds}/>
        </S.StationDataContainer>
      </S.CalendarPageLayout>
    </>
  );
};
export { CalendarPage };
