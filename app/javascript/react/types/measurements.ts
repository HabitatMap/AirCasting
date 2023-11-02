interface FixedMeasurement {
  value: number;
  time: number;
}

interface MobileMeasurement extends FixedMeasurement {
  latitude: number;
  longitude: number;
}

export { FixedMeasurement, MobileMeasurement };
