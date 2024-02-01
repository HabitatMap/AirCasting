interface Thresholds {
  min: number;
  low: number;
  middle: number;
  high: number;
  max: number;
}

interface Threshold {
  name: keyof Thresholds;
  value: number;
}

export { Threshold, Thresholds };
