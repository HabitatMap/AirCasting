interface StreamUpdate {
  lastUpdate: string;
  updateFrequency: string;
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
  lastMeasurementValue: number | undefined;
  lastMeasurementDateLabel: string | undefined;
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
