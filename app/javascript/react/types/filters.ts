const SessionTypes = {
  FIXED: "fixed",
  MOBILE: "mobile",
};

type SessionType = typeof SessionTypes.FIXED | typeof SessionTypes.MOBILE;

type fetchTagsParamsType = {
  tag: string;
  west: string;
  east: string;
  south: string;
  north: string;
  timeFrom: string;
  timeTo: string;
  usernames: string | null;
  sensorName: string;
  unitSymbol: string;
  sessionType: string;
};

const MobileBasicParameterTypes = {
  HUMIDITY: "Humidity",
  PARTICULATE_MATTER: "Particulate Matter",
  SOUND_LEVEL: "Sound Level",
  TEMPERATURE: "Temperature",
};

const FixedBasicParameterTypes = {
  HUMIDITY: "Humidity",
  NITROGEN_DIOXIDE: "Nitrogen Dioxide",
  OZONE: "Ozone",
  PARTICULATE_MATTER: "Particulate Matter",
  TEMPERATURE: "Temperature",
};

type ParameterType =
  | typeof FixedBasicParameterTypes[keyof typeof FixedBasicParameterTypes]
  | typeof MobileBasicParameterTypes[keyof typeof MobileBasicParameterTypes];

export {
  FixedBasicParameterTypes,
  MobileBasicParameterTypes,
  ParameterType,
  SessionType,
  SessionTypes,
  fetchTagsParamsType,
};
