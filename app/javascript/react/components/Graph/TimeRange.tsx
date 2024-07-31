import React, { FC, useEffect, useState } from "react";
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
  const [formattedMinTime, setFormattedMinTime] = useState({
    date: minTime.date ?? "",
    time: minTime.time ?? "",
  });
  const [formattedMaxTime, setFormattedMaxTime] = useState({
    date: maxTime.date ?? "",
    time: maxTime.time ?? "",
  });

  useEffect(() => {
    console.log("minTime or maxTime updated", minTime, maxTime);

    setFormattedMinTime({
      date: minTime.date ?? "",
      time: minTime.time ?? "",
    });
    setFormattedMaxTime({
      date: maxTime.date ?? "",
      time: maxTime.time ?? "",
    });
  }, [minTime, maxTime]);

  return (
    <S.TimeRangeContainer>
      <S.TimeContainer>
        <S.Date>{formattedMinTime.date}</S.Date>
        <S.Time>{formattedMinTime.time}</S.Time>
      </S.TimeContainer>
      -
      <S.TimeContainer>
        <S.Date>{formattedMaxTime.date}</S.Date>
        <S.Time>{formattedMaxTime.time}</S.Time>
      </S.TimeContainer>
    </S.TimeRangeContainer>
  );
};

export default TimeRange;
