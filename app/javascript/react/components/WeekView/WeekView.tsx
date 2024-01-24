import React from "react";

import * as S from "./WeekView.style";
import { DayView } from "../DayView/DayView";

interface WeekData {
  value: number;
  date: Date;
}

interface WeeklyColorRanges {
  bottom: number;
  lower: number;
  middle: number;
  higher: number;
  top: number;
}

interface WeekViewProps {
  weeklyData: WeekData[];
  colorRanges: WeeklyColorRanges;
}

const WeekView = ({ weeklyData, colorRanges }: WeekViewProps) => {
  return (
    <S.HorizontalStack>
      {weeklyData.map((dayData, index) => (
        <DayView
          key={index}
          value={dayData.value}
          date={dayData.date}
          lastDay={weeklyData.length - 1 == index}
          colorRanges={colorRanges}
        />
      ))}
    </S.HorizontalStack>
  );
};

export { WeekView };
