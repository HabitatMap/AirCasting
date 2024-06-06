interface Measurement {
  latitude: number;
  longitude: number;
  time: number;
  value: number;
}

interface MobileStream {
  averageValue: number;
  endTime: string;
  id: number;
  maxLatitude: number;
  maxLongitude: number;
  measurements: Measurement[];
  minLatitude: number;
  minLongitude: number;
  notes: any[];
  sensorName: string;
  sensorUnit: string;
  startLatitude: number;
  startLongitude: number;
  startTime: string;
  streamId: number;
  title: string;
  username: string;
}

interface MobileStreamShortInfo {
  averageValue: number;
  endTime: string | null;
  high: number;
  low: number;
  max: number;
  maxMeasurementValue: number;
  middle: number;
  min: number;
  minMeasurementValue: number;
  profile: string;
  sensorName: string;
  sessionId: string;
  startTime: string;
  title: string;
  unitSymbol: string;
}

export type { MobileStream, MobileStreamShortInfo };
