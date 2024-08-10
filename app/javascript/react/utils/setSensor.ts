import {
  FixedBasicParameterTypes,
  MobileBasicParameterTypes,
  ParameterType,
  SessionType,
  SessionTypes,
} from "../types/filters";
import { Sensor } from "../types/sensors";

const setSensor = (
  selectedParameter: ParameterType,
  sessionType: SessionType,
  sensors: Sensor[]
) => {
  const getSensor = (parameter: string) => {
    const allSensors = sensors.filter(
      (item) => item.measurementType === parameter
    );

    const firstSensor = allSensors[0];

    return firstSensor;
  };

  if (sessionType === SessionTypes.FIXED) {
    switch (selectedParameter) {
      case FixedBasicParameterTypes.PARTICULATE_MATTER:
        return {
          sensorName: "Government-PM2.5",
          unitSymbol: getSensor(selectedParameter).unitSymbol,
        };
      case FixedBasicParameterTypes.HUMIDITY:
        return {
          sensorName: "AirBeam-RH",
          unitSymbol: getSensor(selectedParameter).unitSymbol,
        };
      case FixedBasicParameterTypes.NITROGEN_DIOXIDE:
        return {
          sensorName: "Government-NO2",
          unitSymbol: getSensor(selectedParameter).unitSymbol,
        };
      case FixedBasicParameterTypes.OZONE:
        return {
          sensorName: "Government-Ozone",
          unitSymbol: getSensor(selectedParameter).unitSymbol,
        };
      case FixedBasicParameterTypes.TEMPERATURE:
        return {
          sensorName: "AirBeam-F",
          unitSymbol: getSensor(selectedParameter).unitSymbol,
        };
      default:
        return {
          sensorName: getSensor(selectedParameter).sensorName,
          unitSymbol: getSensor(selectedParameter).unitSymbol,
        };
    }
  } else {
    switch (selectedParameter) {
      case MobileBasicParameterTypes.PARTICULATE_MATTER:
        return {
          sensorName: "AirBeam-PM2.5",
          unitSymbol: getSensor(selectedParameter).unitSymbol,
        };
      case MobileBasicParameterTypes.HUMIDITY:
        return {
          sensorName: "AirBeam-RH",
          unitSymbol: getSensor(selectedParameter).unitSymbol,
        };
      case MobileBasicParameterTypes.SOUND_LEVEL:
        return {
          sensorName: "Phone microphone",
          unitSymbol: getSensor(selectedParameter).unitSymbol,
        };
      case MobileBasicParameterTypes.TEMPERATURE:
        return {
          sensorName: "AirBeam-F",
          unitSymbol: getSensor(selectedParameter).unitSymbol,
        };
      default:
        return {
          sensorName: getSensor(selectedParameter).sensorName,
          unitSymbol: getSensor(selectedParameter).unitSymbol,
        };
    }
  }
};

export { setSensor };
