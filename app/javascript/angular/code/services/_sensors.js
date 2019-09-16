import _ from "underscore";

const buildSensorId = sensor =>
  sensor.measurement_type +
  "-" +
  sensor.sensor_name.toLowerCase() +
  " (" +
  sensor.unit_symbol +
  ")";

const DEFAULT_SENSOR_ID = buildSensorId({
  measurement_type: "Particulate Matter",
  sensor_name: "AirBeam2-PM2.5",
  unit_symbol: "µg/m³"
});

export const sensors = params => {
  var Sensors = function() {
    this.sensors = {};
    this.defaultSensorId = DEFAULT_SENSOR_ID;
  };

  Sensors.prototype = {
    setSensors: function(data) {
      var sensors = {};
      _(data).each(function(sensor) {
        sensor.id = buildSensorId(sensor);

        sensor.sensor_name = sensor.sensor_name.toLowerCase();

        sensors[sensor.id] = sensor;
      });
      this.sensors = sensors;
    },

    selected: function() {
      return this.sensors[params.get("data").sensorId || DEFAULT_SENSOR_ID];
    },

    selectedId: function() {
      return params.get("data").sensorId || DEFAULT_SENSOR_ID;
    },

    selectedSensorName: function() {
      const sensorId = this.selectedId();
      const sensor = this.sensors[sensorId] || {};
      return sensor.sensor_name;
    }
  };
  return new Sensors();
};
