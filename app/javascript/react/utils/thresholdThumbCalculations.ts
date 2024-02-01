const calculateThumbPercentage = (
  value: number,
  min: number,
  max: number
): number => {
  const percentage = (value - min) / (max - min);
  return percentage;
};

const calculateThumbPosition = (
  value: number,
  min: number,
  max: number,
  width: number
): number => {
  const percentage = calculateThumbPercentage(value, min, max);
  return percentage * width;
};

export { calculateThumbPercentage, calculateThumbPosition };
