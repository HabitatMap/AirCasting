interface FixedStreamStation {
  lastUpdate: string;
  profile: string;
  sensorName: string;
  title: string;
  unitSymbol: string;
  updateFrequency: string;
}

interface FixedStream {
  stream: FixedStreamStation;
  // TODO update types
  measurements: any[];
  streamDailyAverages: any[];
}

export { FixedStreamStation, FixedStream };
