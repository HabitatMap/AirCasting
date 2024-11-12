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
  firstMeasurementTime: number;
}

interface FixedMeasurement {
  time: number;
  value: number;
}

interface StreamDailyAverage {
  date: string;
  value: number;
}

interface FixedStream {
  stream: FixedStreamStationInfo;
  measurements: FixedMeasurement[];
  streamDailyAverages: StreamDailyAverage[];
  lastMonthMeasurements: FixedMeasurement[];
}

interface FixedStreamShortInfo extends FixedStreamStationInfo {
  lastMeasurementValue: number | undefined;
  lastMeasurementDateLabel: string | undefined;
  minMeasurementValue: number;
  maxMeasurementValue: number;
  averageValue: number;
}

export type {
  DataSource,
  FixedMeasurement,
  FixedStream,
  FixedStreamShortInfo,
  FixedStreamStationInfo,
  StreamDailyAverage,
  StreamUpdate,
};
