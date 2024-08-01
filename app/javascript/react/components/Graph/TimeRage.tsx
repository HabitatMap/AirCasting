import React, { FC } from "react";
import * as S from "./Graph.style";

interface TimeRangeProps {
  minTime: {
    date: string | null;
    time: string | null;
  };
  maxTime: {
    date: string | null;
    time: string | null;
  };
}

const TimeRange: FC<TimeRangeProps> = ({ minTime, maxTime }) => {
  console.log(maxTime.time, "maxTime");
  return (
    <S.TimeRangeContainer>
      <S.TimeContainer>
        <S.Date>{minTime.date ?? ""}</S.Date>
        <S.Time>{minTime.time ?? ""}</S.Time>
      </S.TimeContainer>
      -
      <S.TimeContainer>
        <S.Date>{maxTime.date ?? ""}</S.Date>
        <S.Time>{maxTime.time ?? ""}</S.Time>
      </S.TimeContainer>
    </S.TimeRangeContainer>
  );
};

export default TimeRange;
