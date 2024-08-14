export type Sensor = {
  id: number;
  measurementType: string;
  sensorName: string;
  unitSymbol: string;
};

export const SENSOR_NAMES = {
  PARTICULATE_MATTER: {
    AIRBEAM_PM25: "AirBeam-PM2.5",
    GOVERNMENT_PM25: "Government-PM2.5",
  },
  HUMIDITY: "AirBeam-RH",
  NITROGEN_DIOXIDE: "Government-NO2",
  OZONE: "Government-Ozone",
  TEMPERATURE: "AirBeam-F",
  SOUND_LEVEL: "Phone microphone",
};
