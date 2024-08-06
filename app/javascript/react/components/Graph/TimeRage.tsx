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
    const [isInitialized, setIsInitialized] = useState(false);
    const [isEmpty, setIsEmpty] = useState(true);

    useEffect(() => {
      if (ref && "current" in ref && ref.current) {
        setIsEmpty(ref.current.childElementCount === 0);
        setIsInitialized(true);
      }
    }, []);

    return (
      <S.TimeRangeContainer ref={ref}>
        {isInitialized && isEmpty && (
          <>
            <S.TimeContainer>
              <S.Date>{minTime.date}</S.Date>
              <S.Time>{minTime.time}</S.Time>
            </S.TimeContainer>
            -
            <S.TimeContainer>
              <S.Date>{maxTime.date}</S.Date>
              <S.Time>{maxTime.time}</S.Time>
            </S.TimeContainer>
          </>
        )}
      </S.TimeRangeContainer>
    );
  }
);

export default TimeRange;
