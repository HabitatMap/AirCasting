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
  width: number,
): number => {
  const percentage = calculateThumbPercentage(value, min, max);

  // added 20 because the slider starts at the center of the first thumb and the calculations are off
  //TODO: look into slider width calculations and thumb placements to fix without "-20"
  return percentage * (width - 20);
};

export { calculateThumbPercentage, calculateThumbPosition };
