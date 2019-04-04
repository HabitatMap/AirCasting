import _ from 'underscore';

const buildSensorId = sensor =>
  sensor.measurement_type.toLowerCase() + "-" + sensor.sensor_name.toLowerCase() + " (" + sensor.unit_symbol + ")";

const DEFAULT_SENSOR_ID = buildSensorId({
  measurement_type: "Particulate Matter",
  sensor_name: "AirBeam2-PM2.5",
  unit_symbol: "µg/m³"
});

export const sensors = (params, storage, heat, $http) => {
  var Sensors = function() {
    this.sensors = {};
    this.defaultSensorId = DEFAULT_SENSOR_ID;
    this.availableSensors = [];
    this.selectedParameter = {};
    this.availableParameters = [];
  };

  Sensors.prototype = {
    setSensors: function(data) {
      var sensors = {};
      var self = this;
      _(data).each(function(sensor){
        sensor.id =  buildSensorId(sensor);
        sensor.label = sensor.sensor_name + " (" + sensor.unit_symbol + ")";

        sensor.sensor_name = sensor.sensor_name.toLowerCase();

        if (sensor.label.length >= 42) {
          sensor.select_label = sensor.label.slice(0, 40) + "…";
        } else {
          sensor.select_label = sensor.label;
        }
        sensors[sensor.id] = sensor;
      });
      this.sensors = sensors;

      // Initialize UI
      this.initSelected();
    },

    initSelected: function() {
      console.log('initSelected()')

      if(_(params.get('data').sensorId).isNull()) {
        console.log('initSelected() - sensorId is null')
        params.update({data: {sensorId: DEFAULT_SENSOR_ID }});
      } else {
        console.log('initSelected() - sensorId is NOT null')
      }
    },

    selected: function() {
        return this.sensors[params.get('data').sensorId || DEFAULT_SENSOR_ID];
    },

    selectedId: function() {
        return params.get('data').sensorId || DEFAULT_SENSOR_ID;
    },

    anySelected: function() {
      return this.selected();
    },
    selectedSensorName: function() {
      const sensorId = this.selectedId();
      const sensor = this.sensors[sensorId] || {};
      return sensor.sensor_name;
    },
    findSensorById: function(id) {
      return this.sensors[id]
    },
    findParameterForSensor: function(sensor) {
      return _(this.availableParameters).find(function(parameter) { return (parameter.id == sensor["measurement_type"]) });
    },
    buildSensorId: function(sensor) {
      return buildSensorId(sensor);
    },
    fetchHeatLevels: function() {
      this.fetchHeatLevelsForSensor(this.selected());
    },

    fetchHeatLevelsForSensor: function(sensor) {
      if (!sensor) return;

      const callback = data => {
        storage.updateDefaults({heat: heat.parse(data)});
        params.update({data: {heat: heat.parse(data)}});
      };
      $http.get('/api/thresholds/' + sensor.sensor_name, {
        params: { unit_symbol: sensor.unit_symbol },
        cache: true
      }).success(callback);
    }
  };
  return new Sensors();
};

const max = (valueOf, xs) => {
  const reducer = (acc, x) => valueOf(x) > valueOf(acc) ? x : acc;
  return xs.reduce(reducer, xs[0]);
};
