import {
  FixedBasicParameterTypes,
  MobileBasicParameterTypes,
  ParameterType,
  SessionType,
} from "../types/filters";
import { Sensor, SENSOR_NAMES } from "../types/sensors";

const setSensor = (
  selectedParameter: ParameterType,
  sessionType: SessionType,
  sensors: Sensor[]
) => {
  const getSensor = (parameter: string, sensorName?: string) => {
    const matchingSensors = sensors.filter(
      (item) =>
        item.measurementType === parameter &&
        (!sensorName || item.sensorName === sensorName)
    );

    return matchingSensors[0];
  };

  let sensorName = "";
  switch (selectedParameter) {
    case FixedBasicParameterTypes.PARTICULATE_MATTER:
      sensorName = SENSOR_NAMES.PARTICULATE_MATTER.GOVERNMENT_PM25;
    case MobileBasicParameterTypes.PARTICULATE_MATTER:
      sensorName = SENSOR_NAMES.PARTICULATE_MATTER.AIRBEAM_PM25;
      break;
    case FixedBasicParameterTypes.HUMIDITY:
    case MobileBasicParameterTypes.HUMIDITY:
      sensorName = SENSOR_NAMES.HUMIDITY;
      break;
    case FixedBasicParameterTypes.NITROGEN_DIOXIDE:
      sensorName = SENSOR_NAMES.NITROGEN_DIOXIDE;
      break;
    case FixedBasicParameterTypes.OZONE:
      sensorName = SENSOR_NAMES.OZONE;
      break;
    case FixedBasicParameterTypes.TEMPERATURE:
    case MobileBasicParameterTypes.TEMPERATURE:
      sensorName = SENSOR_NAMES.TEMPERATURE;
      break;
    case MobileBasicParameterTypes.SOUND_LEVEL:
      sensorName = SENSOR_NAMES.SOUND_LEVEL;
      break;
    default:
      return {
        sensorName: getSensor(selectedParameter).sensorName,
        unitSymbol: getSensor(selectedParameter).unitSymbol,
      };
  }

  const sensor = getSensor(selectedParameter, sensorName);

  if (!sensor) {
    console.warn(
      `No sensor found for parameter: ${selectedParameter} with name: ${sensorName}`
    );
    return {
      sensorName: "Unknown Sensor",
      unitSymbol: "N/A",
    };
  }

  return {
    sensorName: sensor.sensorName,
    unitSymbol: sensor.unitSymbol,
  };
};

export { setSensor };
