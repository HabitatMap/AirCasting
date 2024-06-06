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
  sessionId: string;
  title: string;
  unitSymbol: string;
  active: boolean;
  min: number;
  low: number;
  middle: number;
  high: number;
  max: number;
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
  averageValue: number | undefined;
  lastMeasurementValue: number | undefined;
  lastMeasurementDateLabel: string | undefined;
  maxMeasurementValue: number;
  minMeasurementValue: number;
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
