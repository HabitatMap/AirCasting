interface StreamUpdate {
  lastUpdate: string | null;
  updateFrequency: string;
  startTime: string;
  endTime: string | null;
}

interface DataSource {
  profile: string;
  sensorName: string;
}

interface FixedStreamStationInfo extends StreamUpdate, DataSource {
  sessionId: number;
  title: string;
  unitSymbol: string;
  active: boolean;
  min: number;
  low: number;
  middle: number;
  high: number;
  max: number;
  latitude: number;
  longitude: number;
}

interface Measurement {
  time: number;
  value: number;
}

interface StreamDailyAverage {
  date: string;
  value: number;
}

interface FixedStream {
  stream: FixedStreamStationInfo;
  measurements: Measurement[];
  streamDailyAverages: StreamDailyAverage[];
}

interface FixedStreamShortInfo extends FixedStreamStationInfo {
  averageValue: number;
  lastMeasurementValue: number | undefined;
  lastMeasurementDateLabel: string | undefined;
  maxMeasurementValue: number;
  minMeasurementValue: number;
}

interface FixedGraphData {
  measurements: Measurement[];
  unitSymbol: string;
  measurementType: string;
}

export type {
  StreamUpdate,
  DataSource,
  FixedStreamStationInfo,
  StreamDailyAverage,
  FixedStream,
  FixedStreamShortInfo,
  Measurement,
};
