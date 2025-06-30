import { CustomMarker } from "../../../../../types/googleMaps";

export const calculateClusterAverage = (markers: CustomMarker[]): number => {
  const numericValues = markers
    .map((marker) => marker.value)
    .filter((value): value is number => typeof value === "number");

  if (numericValues.length === 0) {
    return 0;
  }

  const sum = numericValues.reduce((acc, value) => acc + value, 0);

  return sum / numericValues.length;
};

export const getClusterSize = (markers: CustomMarker[]): number => {
  return markers.length;
};
