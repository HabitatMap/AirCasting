angular.module("aircasting").factory("singleFixedSession", [
  "fixedSessions",
  "sensors",
  "storage",
  "heat",
  "drawSession",
  function(fixedSessions, sensors, storage, heat, drawSession) {
    var SingleFixedSession = function() {};
    SingleFixedSession.prototype = {
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
      selectedStream: function() {
        return this.get().streams[sensors.anySelected().sensor_name];
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
