import React, { forwardRef, useLayoutEffect, useState } from "react";
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
    const [shouldShowInitial, setShouldShowInitial] = useState(true);

    useLayoutEffect(() => {
      // Only check once on mount
      if (ref && "current" in ref && ref.current) {
        const hasContent = ref.current.childElementCount > 0;
        setShouldShowInitial(!hasContent);
      }
    }, []); // Empty dependency array means this runs once on mount

    return (
      <S.TimeRangeContainer ref={ref}>
        {shouldShowInitial && (
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
