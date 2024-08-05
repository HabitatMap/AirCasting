import React, { forwardRef } from "react";
import * as S from "./Graph.style";

const TimeRange = forwardRef<HTMLDivElement>(({}, ref) => {
  return <S.TimeRangeContainer ref={ref}></S.TimeRangeContainer>;
});

export default TimeRange;
