import { CustomMarker } from "../../../../../types/googleMaps";

export const calculateClusterAverage = (markers: CustomMarker[]): number => {
  const sum = markers.reduce((acc, marker) => {
    return acc + Number(marker.value || 0);
  }, 0);

  return sum / markers.length;
};

export const getClusterSize = (markers: CustomMarker[]): number => {
  return markers.length;
};
