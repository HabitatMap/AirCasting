import _ from 'underscore';

const buildSensorId = sensor =>
  sensor.measurement_type + "-" + sensor.sensor_name + " (" + sensor.unit_symbol + ")";

const ALL_SENSOR = { id: "all", select_label: "All", session_count: 0, measurement_type: "all" };
const ALL_PARAMETER = { id: "all", label: "All" };
const DEFAULT_SENSOR_ID = buildSensorId({
  measurement_type: "Particulate Matter",
  sensor_name: "AirBeam2-PM2.5",
  unit_symbol: "µg/m³"
});

export const sensors = (params, $http) => {
  var Sensors = function() {
    this.sensors = {};
    this.candidateSelectedSensorId = undefined;
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
      this.selectedParameter = this.findParameterForSensor(this.selected());
      this.availableSensors = [ALL_SENSOR].concat(findAvailableSensorsForParameter(sort, this.sensors, this.selectedParameter));
    },

    //selected sensor in dropdown
    //undefined if all
    selected: function() {
      return params.get('data').sensorId === ALL_SENSOR.id ?
        undefined :
        this.sensors[params.get('data').sensorId || DEFAULT_SENSOR_ID];
    },

    selectedId: function() {
      return this.selected() ?
        this.selected().id : undefined;
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
      if (selectedParameter === oldValue) return; // first angular watch run
      console.log('onSelectedParameterChange() - ', selectedParameter, ' - ', oldValue)
      params.update({selectedSessionIds: []});
      if (hasChangedToAll(selectedParameter)) {
        this.availableSensors = [ALL_SENSOR].concat(sort(Object.values(this.sensors)));
        params.update({data: {sensorId: ALL_SENSOR.id}});
      } else {
        this.availableSensors = [ALL_SENSOR].concat(sort(Object.values(this.sensors).filter(sensor => sensor.measurement_type === selectedParameter.id)));
        const sensorId = defaultSensorIdForParameter(selectedParameter, this.availableSensors);
        params.update({ data: { sensorId }});
      }
    },
    onSelectedSensorChange: function(newSensorId, oldSensorId) {
      if (newSensorId === oldSensorId) return;
      console.log('onSelectedSensorChange() - ', newSensorId, ' - ', oldSensorId);
      if(hasChangedToAll(newSensorId)){
        params.update({data: {sensorId: ALL_SENSOR.id}});
      }
      var sensor = this.findSensorById(newSensorId);
      var parameterForSensor = this.findParameterForSensor(sensor);
      this.selectedParameter = parameterForSensor;
    },
    buildSensorId: function(sensor) {
      return buildSensorId(sensor);
    },
    onSensorsSelectedIdChange: function(newValue, oldValue, callback) {
      if(hasChangedToAll(newValue)) return;

      console.log("onSensorsSelectedIdChange 1 - ", newValue, " - ", oldValue);

      if (callback) {
        $http.get( '/api/thresholds/' + this.selected().sensor_name, {
          params: { unit_symbol: this.selected().unit_symbol },
          cache: true
        }).success(callback);
      }

      if (newValue === oldValue) return; // first angular watch run

      console.log("onSensorsSelectedIdChange 2 - ", newValue, " - ", oldValue);

      params.update({data: {sensorId: newValue}});
      params.update({selectedSessionIds: []});
    }
  };
  return new Sensors();
};

const hasChangedToAll = newValue => !newValue || newValue === ALL_SENSOR.id;

const max = (valueOf, xs) => {
  const reducer = (acc, x) => valueOf(x) > valueOf(acc) ? x : acc;
  return xs.reduce(reducer, xs[0]);
};

export const findAvailableSensorsForParameter = (sort, sensors, parameter) =>
  parameter === ALL_PARAMETER ?
    sort(Object.values(sensors)) :
    sort(Object.values(sensors).filter(sensor => sensor.measurement_type === parameter.id));

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
