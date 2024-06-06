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

interface MobileStreamShortInfo {
  averageValue: number | undefined;
  endTime: string | null;
  min: number;
  max: number;
  profile: string;
  sensorName: string;
  sessionId: string;
  startTime: string;
  title: string;
  unitSymbol: string;
}

export type { MobileStream, MobileStreamShortInfo };
