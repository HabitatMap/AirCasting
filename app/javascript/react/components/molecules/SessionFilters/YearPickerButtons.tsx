import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import chevronRight from "../../../assets/icons/chevronRight.svg";
import { useAppDispatch } from "../../../store/hooks";
import { setFetchingData } from "../../../store/mapSlice";
import { useMapParams } from "../../../utils/mapParamsHandler";
import * as S from "./SessionFilters.style";

export const beginningOfTheYear = (year: number): number =>
  new Date(`${year}-01-01T00:00:00Z`).getTime() / 1000;

export const endOfTheYear = (year: number): number =>
  new Date(`${year}-12-31T23:59:59Z`).getTime() / 1000;

// The earliest year available in the app
export const EARLIEST_YEAR = 2011;

// Updated function to replace getLastFiveYears
export const getAvailableYears = (count: number = 5): number[] => {
  const currentYear = new Date().getFullYear();
  const years: number[] = [];

  for (let i = 0; i < count; i++) {
    const year = currentYear - i;
    if (year >= EARLIEST_YEAR) {
      years.push(year);
    }
  }

  return years;
};

// Keep the original function for backward compatibility
export const getLastFiveYears = (): number[] => {
  return getAvailableYears(5);
};

const YearPickerButtons = () => {
  const dispatch = useAppDispatch();
  const { timeFrom, updateTime } = useMapParams();
  const { t } = useTranslation();

  const timestampToYear = (timestamp: string): number => {
    const date = new Date(Number(timestamp) * 1000);
    return date.getUTCFullYear();
  };

  const [centerYear, setCenterYear] = useState(new Date().getFullYear());

  useEffect(() => {
    if (timeFrom) {
      const selectedYear = timestampToYear(timeFrom);
      // Ensure we don't go before EARLIEST_YEAR
      const safeYear = Math.max(selectedYear, EARLIEST_YEAR);
      // Only update centerYear on initial load to prevent visibility shifting
      setCenterYear(safeYear);
    }
  }, []);

  const handleYear = useCallback(
    (year: number) => {
      updateTime(year);
      dispatch(setFetchingData(true));
    },
    [dispatch, updateTime]
  );

  const handlePreviousYears = () => {
    if (centerYear > EARLIEST_YEAR) {
      setCenterYear((prev) => Math.max(prev - 1, EARLIEST_YEAR));
    }
  };

  const handleNextYears = () => {
    const currentDate = new Date();
    if (centerYear < currentDate.getFullYear()) {
      setCenterYear((prev) => Math.min(prev + 1, currentDate.getFullYear()));
    }
  };

  const isPreviousDisabled = centerYear <= EARLIEST_YEAR;
  const isNextDisabled = centerYear >= new Date().getFullYear();

  const getVisibleYears = () => {
    const years: number[] = [];
    const currentDate = new Date();
    const latestYear = currentDate.getFullYear();

    const adjustedCenterYear = Math.max(centerYear, EARLIEST_YEAR);

    for (let i = 0; i < 4; i++) {
      const year = adjustedCenterYear - i;
      if (year >= EARLIEST_YEAR) {
        years.push(year);
      }
    }

    // If we have fewer than 4 years, add years from the future if possible
    while (years.length < 4 && years[0] < latestYear) {
      const nextYear: number = years[0] + 1;
      if (nextYear <= latestYear) {
        years.unshift(nextYear);
      } else {
        break;
      }
    }

    return years;
  };

  return (
    <S.SectionButtonsContainer>
      <S.ChevronButton
        onClick={handleNextYears}
        disabled={isNextDisabled}
        $isDisabled={isNextDisabled}
        $rotated
      >
        <img src={chevronRight} alt={t("filters.previousYear")} />
      </S.ChevronButton>

      {getVisibleYears().map((year) => (
        <S.SectionButton
          key={year}
          onClick={() => handleYear(year)}
          $isActive={timestampToYear(timeFrom) === year}
        >
          {year}
        </S.SectionButton>
      ))}

      <S.ChevronButton
        onClick={handlePreviousYears}
        disabled={isPreviousDisabled}
        $isDisabled={isPreviousDisabled}
      >
        <img src={chevronRight} alt={t("filters.nextYear")} />
      </S.ChevronButton>
    </S.SectionButtonsContainer>
  );
};

export { YearPickerButtons };
