import _ from 'underscore';

const buildSensorId = sensor =>
  sensor.measurement_type + "-" + sensor.sensor_name.toLowerCase() + " (" + sensor.unit_symbol + ")";

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

      this.availableParameters = buildAvailableParameters(this.sensors);

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
      this.selectedParameter = this.findParameterForSensor(this.selected()); //uses the watch
      this.availableSensors = findAvailableSensorsForParameter(sort, this.sensors, this.selectedParameter);
    },

    selected: function() {
        return this.sensors[params.get('data').sensorId || DEFAULT_SENSOR_ID];
    },

    selectedId: function() {
        return this.selected().id;
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
    onSelectedParameterChange: function(selectedParameter, oldValue) {
      if (selectedParameter === oldValue) return; // first angular watch run
      console.log('onSelectedParameterChange() - ', selectedParameter, ' - ', oldValue)
      params.update({selectedSessionIds: []});

      this.availableSensors = sort(Object.values(this.sensors).filter(sensor => sensor.measurement_type === selectedParameter.id));
      const sensorId = defaultSensorIdForParameter(selectedParameter, this.availableSensors);
      params.update({ data: { sensorId }});
    },
    onSelectedSensorChange: function(newSensorId, oldSensorId) {
      if (newSensorId === oldSensorId) return;
      console.log('onSelectedSensorChange() - ', newSensorId, ' - ', oldSensorId);
      var sensor = this.findSensorById(newSensorId);
      var parameterForSensor = this.findParameterForSensor(sensor);
      this.selectedParameter = parameterForSensor; //uses the watch
    },
    buildSensorId: function(sensor) {
      return buildSensorId(sensor);
    },
    onSensorsSelectedIdChange: function(newValue, oldValue, callback) {
      console.log("onSensorsSelectedIdChange 1 - ", newValue, " - ", oldValue);

      if (newValue === oldValue) return; // first angular watch run

      console.log("onSensorsSelectedIdChange 2 - ", newValue, " - ", oldValue);

      this.fetchHeatLevels();
      params.update({data: {sensorId: newValue}});
      params.update({selectedSessionIds: []});
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

export const findAvailableSensorsForParameter = (sort, sensors, parameter) =>
    sort(Object.values(sensors).filter(sensor => sensor.measurement_type === parameter.id));

export const sort = sensors => {
  const ORDERS = {};
  ORDERS[buildSensorId({measurement_type: "Particulate Matter", sensor_name: "AirBeam2-PM2.5", unit_symbol: "µg/m³"})] = 4;
  ORDERS[buildSensorId({measurement_type: "Particulate Matter", sensor_name: "AirBeam2-PM1", unit_symbol: "µg/m³"})] = 3;
  ORDERS[buildSensorId({measurement_type: "Particulate Matter", sensor_name: "AirBeam2-PM10", unit_symbol: "µg/m³"})] = 2;
  ORDERS[buildSensorId({measurement_type: "Particulate Matter", sensor_name: "AirBeam-PM", unit_symbol: "µg/m³"})] = 1;
  ORDERS[buildSensorId({measurement_type: "Humidity", sensor_name: "AirBeam2-RH", unit_symbol: "%"})] = 2;
  ORDERS[buildSensorId({measurement_type: "Humidity", sensor_name: "AirBeam-RH", unit_symbol: "%"})] = 1;
  ORDERS[buildSensorId({measurement_type: "Temperature", sensor_name: "AirBeam2-F", unit_symbol: "F"})] = 2;
  ORDERS[buildSensorId({measurement_type: "Temperature", sensor_name: "AirBeam-F", unit_symbol: "F"})] = 1;
  ORDERS[buildSensorId({measurement_type: "Sound Level", sensor_name: "Phone Microphone", unit_symbol: "dB"})] = 1;

  const compare = (sensor1, sensor2) => {
    if (ORDERS[sensor1.id] && ORDERS[sensor2.id]) {
      return ORDERS[sensor2.id] - ORDERS[sensor1.id];
    } else if (ORDERS[sensor1.id]) {
      return -1;
    } else if (ORDERS[sensor2.id]) {
      return +1;
    } else {
      return sensor2.session_count - sensor1.session_count;
    }
  }

  return sensors.sort(compare);
}

export const defaultSensorIdForParameter = (parameter, sensors) => {
  const DEFAULT_IDS = {
    "Particulate Matter": buildSensorId({
      measurement_type: "Particulate Matter",
      sensor_name:      "AirBeam2-PM2.5",
      unit_symbol:      "µg/m³"
    }),
    "Humidity": buildSensorId({
      measurement_type: "Humidity",
      sensor_name:      "AirBeam2-RH",
      unit_symbol:      "%"
    }),
    "Temperature": buildSensorId({
      measurement_type: "Temperature",
      sensor_name:      "AirBeam2-F",
      unit_symbol:      "F"
    }),
    "Sound Level": buildSensorId({
      measurement_type: "Sound Level",
      sensor_name:      "Phone Microphone",
      unit_symbol:      "dB"
    })
  };

  return DEFAULT_IDS[parameter.id] || max(sensor => sensor.session_count, sensors).id;
};

export const buildAvailableParameters = sensors => {
  const uniq = (v, i, a) => a.indexOf(v) === i;

  return Object.values(sensors)
    .sort((a, b) => b.session_count - a.session_count)
    .map(sensor => sensor.measurement_type)
    .filter(uniq)
    .map(measurementType => ({ label: measurementType, id: measurementType }));
}
