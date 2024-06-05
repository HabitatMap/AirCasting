interface Measurement {
  latitude: number;
  longitude: number;
  time: number;
  value: number;
}

interface MobileStream {
  averageValue: number;
  endTime: number;
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
  startTime: number;
  streamId: number;
  title: string;
  username: string;
}

export type { MobileStream };
