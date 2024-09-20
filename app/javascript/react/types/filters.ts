const SessionTypes = {
  FIXED: "fixed",
  MOBILE: "mobile",
};

type SessionType = typeof SessionTypes.FIXED | typeof SessionTypes.MOBILE;

type ParamsType = {
  tags: string | null;
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
  isIndoor: boolean;
  isActive: boolean;
};

const ParameterTypes = {
  HUMIDITY: "Humidity",
  NITROGEN_DIOXIDE: "Nitrogen Dioxide",
  OZONE: "Ozone",
  PARTICULATE_MATTER: "Particulate Matter",
  SOUND_LEVEL: "Sound Level",
  TEMPERATURE: "Temperature",
};

const MobileBasicParameterTypes = [
  ParameterTypes.HUMIDITY,
  ParameterTypes.PARTICULATE_MATTER,
  ParameterTypes.SOUND_LEVEL,
  ParameterTypes.TEMPERATURE,
];

const FixedBasicParameterTypes = [
  ParameterTypes.HUMIDITY,
  ParameterTypes.NITROGEN_DIOXIDE,
  ParameterTypes.OZONE,
  ParameterTypes.PARTICULATE_MATTER,
  ParameterTypes.TEMPERATURE,
];

type ParameterType = typeof ParameterTypes[keyof typeof ParameterTypes];

const UnitSymbols = {
  ParticulateMatter: "µg/m³",
};

export {
  FixedBasicParameterTypes,
  MobileBasicParameterTypes,
  ParameterType,
  ParameterTypes,
  ParamsType,
  SessionType,
  SessionTypes,
  UnitSymbols,
};
