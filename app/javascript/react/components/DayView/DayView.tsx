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
  lastDay: Boolean;
  colorRanges: ColorRanges;
}

const DayView = ({ value, date, lastDay, colorRanges }: DayViewProps) => {
  return (
    <S.RectangleContainer>
      <S.Label>{value} (µg/m)</S.Label>

      <S.BackgroundContainer>
        {lastDay && (
          <>
            <S.ColorRangeLine
              value={colorRanges.bottom}
              maxValue={colorRanges.top}
            />
            <S.ColorRangeLine
              value={colorRanges.middle}
              maxValue={colorRanges.top}
            />
            <S.ColorRangeLine
              value={colorRanges.top}
              maxValue={colorRanges.top}
            />
          </>
        )}
      </S.BackgroundContainer>
      <S.ColorfullRectangleContainer value={value} colorRanges={colorRanges} />
      <S.BottomLabel>
        {date.getDate()} {date.toLocaleString("default", { month: "short" })}
      </S.BottomLabel>
    </S.RectangleContainer>
  );
};

export { DayView };
