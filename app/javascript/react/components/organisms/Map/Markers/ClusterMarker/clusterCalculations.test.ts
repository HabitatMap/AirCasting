import { CustomMarker } from "../../../../../types/googleMaps";
import { calculateClusterAverage, getClusterSize } from "./clusterCalculations";

describe("Cluster Calculations", () => {
  const mockMarkers: CustomMarker[] = [
    { value: 10 } as CustomMarker,
    { value: 20 } as CustomMarker,
    { value: 30 } as CustomMarker,
  ];

  describe("calculateClusterAverage", () => {
    it("calculates the average value of markers correctly", () => {
      const average = calculateClusterAverage(mockMarkers);
      expect(average).toBe(20); // (10 + 20 + 30) / 3 = 20
    });

    it("handles empty marker array", () => {
      const average = calculateClusterAverage([]);
      expect(average).toBe(0); // or NaN, depending on your requirements
    });
  });

  describe("getClusterSize", () => {
    it("returns correct number of markers in cluster", () => {
      const size = getClusterSize(mockMarkers);
      expect(size).toBe(3);
    });

    it("handles empty marker array", () => {
      const size = getClusterSize([]);
      expect(size).toBe(0);
    });
  });
});
