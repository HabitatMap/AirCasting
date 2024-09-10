import { createSelector } from "@reduxjs/toolkit";
import { isValidValue } from "../utils/measurementsCalc";
import { RootState } from "./index";

const selectMeasurementsState = (state: RootState) => state.measurements;

export const selectMeasurementsExtremes = createSelector(
  [selectMeasurementsState],
  (measurements) => {
    const {
      averageMeasurementValue,
      minMeasurementValue,
      maxMeasurementValue,
    } = measurements;

    const min = isValidValue(minMeasurementValue)
      ? Math.round(minMeasurementValue!)
      : null;
    const max = isValidValue(maxMeasurementValue)
      ? Math.round(maxMeasurementValue!)
      : null;
    const avg = isValidValue(averageMeasurementValue)
      ? Math.round(averageMeasurementValue!)
      : null;
    return {
      minMeasurementValue: min,
      maxMeasurementValue: max,
      averageValue: avg,
    };
  }
);

export const selectMeasurementsData = createSelector(
  [selectMeasurementsState],
  (measurements) => measurements.data
);

export const selectMeasurementsIsLoading = createSelector(
  [selectMeasurementsState],
  (measurements) => measurements.isLoading
);

export const selectMeasurementsStatus = createSelector(
  [selectMeasurementsState],
  (measurements) => measurements.status
);

export const selectMeasurementsError = createSelector(
  [selectMeasurementsState],
  (measurements) => measurements.error
);
