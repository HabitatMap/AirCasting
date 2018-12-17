import _ from 'underscore';

const ALL_SENSOR = { id: "all", select_label: "All", session_count: 0 };
const ALL_PARAMETER = { id: "all", label: "All" };

export const sensors = (params, $http) => {
  var Sensors = function() {
    this.sensors = {};
    this.candidateSelectedSensorId = undefined;
    this.shouldInitSelected = false;
    this.defaultSensor = this.buildSensorId({
      measurement_type: "Particulate Matter",
      sensor_name:      "AirBeam2-PM2.5",
      unit_symbol:      "µg/m³"
    });

    this.availableSensors = [];
    this.defaultParameter = {id: "Particulate Matter", label: "Particulate Matter"};
    this.selectedParameter = {};
    // [{label: "Activity Level", id: "Activity Level"}, ...]
    this.availableParameters = [];
  };
  Sensors.prototype = {
    setSensors : function(data, status, headers, config) {
      // Sensors
      var sensors = {};
      var self = this;
      _(data).each(function(sensor){
        sensor.id =  self.buildSensorId(sensor);
        sensor.label = sensor.sensor_name + " (" + sensor.unit_symbol + ")";
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
      var self = this;

      if(_(params.get('data').sensorId).isNull()) {
        console.log('initSelected() - sensorId is null')
        params.update({data: {sensorId: this.defaultSensor }});
      } else {
        console.log('initSelected() - sensorId is NOT null')
      }
      this.selectedParameter = self.findParameterForSensor(self.selected());
      this.availableSensors = [ALL_SENSOR].concat(findAvailableSensorsForParameter(sort, this.sensors, self.selectedParameter));
    },

    //selected sensor in dropdown
    selected: function() {
      return this.sensors[params.get('data').sensorId];
    },
    selectedId: function() {
      return this.selected() ? this.selected().id : ALL_SENSOR.id;
    },
    //used when "all" sensors are choosen
    tmpSelected: function() {
      return this.sensors[params.get('tmp').selectedSensorId];
    },
    tmpSelectedId: function() {
      if(!this.tmpSelected()){
        return;
      }
      return this.tmpSelected().id;
    },
    //pick tmp when "all option is selected
    anySelected: function() {
      return this.selected() || this.tmpSelected();
    },
    anySelectedId: function() {
      if(!this.anySelected()){
        return;
      }
      return this.anySelected().id;
    },
    proceedWithTmp: function() {
      params.update({tmp: {selectedSensorId: this.candidateSelectedSensorId}});
    },
    findSensorById: function(id) {
      return this.sensors[id]
    },
    findParameterForSensor: function(sensor) {
      if (sensor) {
        return _(this.availableParameters).find(function(parameter) { return (parameter.id == sensor["measurement_type"]) });
      } else {
        return ALL_PARAMETER;
      }
    },
    onSelectedParameterChange: function(selectedParameter, oldValue) {
      console.log('onSelectedParameterChange() - ', selectedParameter)
      params.update({selectedSessionIds: []});
      if (selectedParameter.id === ALL_PARAMETER.id) {
        this.availableSensors = [ALL_SENSOR].concat(sort(Object.values(this.sensors)));
        params.update({data: {sensorId: ALL_SENSOR.id}});
      } else {
        this.availableSensors = [ALL_SENSOR].concat(sort(Object.values(this.sensors).filter(sensor => sensor.measurement_type === selectedParameter.id)));
        const sensorId = defaultSensorIdForParameter(selectedParameter, this.availableSensors);
        params.update({ data: { sensorId }});
      }
    },
    // changed params.get('data').sensorId
    onSelectedSensorChange: function(newSensorId) {
      console.log('onSelectedSensorChange() - ', newSensorId);
      if (!newSensorId) return;
      if(newSensorId === ALL_SENSOR.id) params.update({data: {sensorId: ALL_SENSOR.id}});
      var sensor = this.findSensorById(newSensorId);
      var parameterForSensor = this.findParameterForSensor(sensor);
      this.selectedParameter = parameterForSensor;
    },
    buildSensorId: function(sensor) {
      return buildSensorId(sensor);
    },
    // dropdown
    onSensorsSelectedIdChange: function(newValue, oldValue, callback) {
      console.log("onSensorsSelectedIdChange - ", newValue, " - ", oldValue);

      if(!newValue || newValue === ALL_SENSOR.id) return;

      if (callback) {
        $http.get( '/api/thresholds/' + this.selected().sensor_name, {
          params: { unit_symbol: this.selected().unit_symbol },
          cache: true
        }).success(callback);
      }

      if (newValue === oldValue) return; // first angular watch run

      params.update({data: {sensorId: newValue}});
      params.update({selectedSessionIds: []});
    }
  };
  return new Sensors();
};

const max = (valueOf, xs) => {
  const reducer = (acc, x) => valueOf(x) > valueOf(acc) ? x : acc;
  return xs.reduce(reducer, xs[0]);
};

export const findAvailableSensorsForParameter = (sort, sensors, parameter) =>
  parameter.id !== ALL_PARAMETER.id ?
    sort(Object.values(sensors).filter(sensor => sensor.measurement_type === parameter.id)) :
    sort(Object.values(sensors));

export const sort = sensors => {
  const ORDERS = {
    "Particulate Matter-AirBeam2-PM2.5 (µg/m³)": 4,
    "Particulate Matter-AirBeam2-PM1 (µg/m³)": 3,
    "Particulate Matter-AirBeam2-PM10 (µg/m³)": 2,
    "Particulate Matter-AirBeam-PM (µg/m³)": 1,
    "Humidity-AirBeam2-RH (%)": 2,
    "Humidity-AirBeam-RH (%)": 1,
    "Temperature-AirBeam2-F (F)": 2,
    "Temperature-AirBeam-F (F)": 1,
    "Sound Level-Phone Microphone (dB)": 1
  };

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

const buildSensorId = sensor =>
  sensor.measurement_type + "-" + sensor.sensor_name + " (" + sensor.unit_symbol + ")";

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

  return [ALL_PARAMETER].concat(
    Object.values(sensors)
    .sort((a, b) => b.session_count - a.session_count)
    .map(sensor => sensor.measurement_type)
    .filter(uniq)
    .map(measurementType => ({ label: measurementType, id: measurementType }))
  );
}
