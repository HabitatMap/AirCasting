import React, { forwardRef, useEffect, useState } from "react";
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

const TimeRange = forwardRef<HTMLDivElement, TimeRangeProps>(
  ({ minTime, maxTime }, ref) => {
    const [isEmpty, setIsEmpty] = useState(true);

    useEffect(() => {
      if (ref && "current" in ref && ref.current) {
        setIsEmpty(ref.current.childElementCount === 0);
      }
    }, [ref]);

    return isEmpty ? (
      <S.TimeRangeContainer>
        <S.TimeContainer>
          <S.Date>{minTime.date}</S.Date>
          <S.Time>{minTime.time}</S.Time>
        </S.TimeContainer>
        -
        <S.TimeContainer>
          <S.Date>{maxTime.date}</S.Date>
          <S.Time>{maxTime.time}</S.Time>
        </S.TimeContainer>
      </S.TimeRangeContainer>
    ) : (
      <S.TimeRangeContainer ref={ref} />
    );
  }
);

export default TimeRange;
