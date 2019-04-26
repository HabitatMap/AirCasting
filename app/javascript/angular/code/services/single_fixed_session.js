angular.module("aircasting").factory("singleFixedSession", [
  "fixedSessions",
  "sensors",
  "storage",
  "heat",
  "drawSession",
  function(fixedSessions, sensors, storage, heat, drawSession) {
    var SingleFixedSession = function() {};
    SingleFixedSession.prototype = {
      isSingle: function() {
        return this.noOfSelectedSessions() == 1;
      },
      noOfSelectedSessions: function() {
        return fixedSessions.allSelected().length;
      },
      get: function() {
        return _(fixedSessions.allSelected()).first();
      },
      endTime: function() {
        return this.get().end_time_local;
      },
      startTime: function() {
        return this.get().start_time_local;
      },
      withSelectedSensor: function() {
        return !!this.get().streams[sensors.anySelected().sensor_name];
      },
      selectedStream: function() {
        return this.get().streams[sensors.anySelected().sensor_name];
      },
      measurements: function() {
        return drawSession.measurements(this.get());
      },
      updateHeat: function() {
        var data = heat.toSensoredList(
          this.get().streams[sensors.anySelected().sensor_name]
        );
        storage.updateDefaults({ heat: heat.parse(data) });
        storage.reset("heat");
      },
      isFixed: function() {
        return true;
      }
    };
    return new SingleFixedSession();
  }
]);
