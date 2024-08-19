export type TimelapseCluster = {
  [clusterId: string]: {
    time: string;
    value: number;
    sessions: any[]; //TODO - define type
  }[];
};
