import _ from "underscore";
import { getParams } from "./params";
import constants from "./constants";

const buildSensorId = (sensor) =>
  sensor.measurement_type +
  "-" +
  sensor.sensor_name.toLowerCase() +
  " (" +
  sensor.unit_symbol +
  ")";

export const sensors = (params) => {
  var Sensors = function () {
    this.sensors = {};
  };

  Sensors.prototype = {
    defaultSensorId: function () {
       return buildSensorId({
         measurement_type: "Particulate Matter",
         sensor_name: "AirBeam-PM2.5",
         unit_symbol: "µg/m³",
      })
    },

    setSensors: function (data) {
      var sensors = {};
      _(data).each(function (sensor) {
        sensor.id = buildSensorId(sensor);

        sensor.sensor_name = sensor.sensor_name.toLowerCase();

        sensors[sensor.id] = sensor;
      });
      this.sensors = sensors;
    },

    selected: function () {
      return this.sensors[params().data.sensorId || defaultSensorId()];
    },

    selectedId: function () {
      return params().data.sensorId || defaultSensorId();
    },

    selectedSensorName: function () {
      const sensorId = this.selectedId();
      const sensor = this.sensors[sensorId] || {};
      return sensor.sensor_name;
    },
  };
  return new Sensors();
};

export default sensors(getParams);
