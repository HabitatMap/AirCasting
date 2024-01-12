import React from "react";
import * as S from "./DayView.style";

interface ColorRanges {
  bottom: number;
  lower: number;
  middle: number;
  higher: number;
  top: number;
}

interface DayViewProps {
  value: number;
  date: Date;
  colorRanges: ColorRanges;
}

const DayView = ({ value, date, colorRanges }: DayViewProps) => {
  return (
    <S.RectangleContainer>
      <S.Label>{value} (µg/m)</S.Label>
      <S.BackgroundContainer />
      <S.ColorfullRectangleContainer value={value} colorRanges={colorRanges} />
      <S.BottomLabel>
        {date.getDate()} {date.toLocaleString("default", { month: "short" })}
      </S.BottomLabel>
    </S.RectangleContainer>
  );
};

export { DayView };
