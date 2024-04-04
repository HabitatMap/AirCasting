import React from "react";

import * as S from "./DayNamesHeader.style";

const DayNamesHeader = ({ dayNamesHeader }: { dayNamesHeader: string[] }) => {
  return (
    <S.DayNamesHeaderContainer>
      {dayNamesHeader.map((dayName) => (
        <S.DayName key={dayName}>{dayName}</S.DayName>
      ))}
    </S.DayNamesHeaderContainer>
  );
};

export { DayNamesHeader };
