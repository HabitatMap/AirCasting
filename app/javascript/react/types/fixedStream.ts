interface StreamUpdate {
  lastUpdate: string;
  updateFrequency: string;
}

interface DataSource {
  profile: string;
  sensorName: string;
}

interface FixedStreamStationInfo extends StreamUpdate, DataSource {
  title: string;
  unitSymbol: string;
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
  lastMeasurementValue: Measurement["value"];
  lastMeasurementDateLabel: string;
}

export type {
  StreamUpdate,
  DataSource,
  FixedStreamStationInfo,
  FixedStream,
  FixedStreamShortInfo,
};
