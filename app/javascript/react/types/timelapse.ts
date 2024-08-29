export enum TimeRanges {
  HOURS_24 = "24hours",
  DAYS_3 = "3days",
  DAYS_7 = "7days",
}

interface SessionData {
  value: number;
  latitude: number;
  longitude: number;
  sessions: number;
}

export type TimelapseData = {
  [timestamp: string]: SessionData[];
};
