export const calculateMeasurementStats = (measurements: { value: number }[]): { min: number, max: number, avg: number } => {
  if (measurements.length === 0) {
    return { min: 0, max: 0, avg: 0 };
  }

  const values = measurements.map(m => m.value);
  const min = Math.round(Math.min(...values));
  const max = Math.round(Math.max(...values));
  const avg = Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);

  return { min, max, avg };
};

export const isNoData = (...values: (number | null | undefined)[]): boolean => {
  return values.some((value) => value === undefined || value === null);
};

export const isValidValue = (value: number | null | undefined): boolean => {
  return value !== null && value !== undefined && isFinite(value);
};
