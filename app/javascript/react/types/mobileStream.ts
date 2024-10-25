import { Note } from "./note";

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
  notes: Note[];
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
  endTime: string | null;
  profile: string;
  sensorName: string;
  sessionId: number;
  startTime: string;
  title: string;
  unitSymbol: string;
  minMeasurementValue: number;
  maxMeasurementValue: number;
  averageValue: number;
}

interface MobileGraphData {
  measurements: Measurement[];
  unitSymbol: string;
  measurementType: string;
}

export type { MobileGraphData, MobileStream, MobileStreamShortInfo };
