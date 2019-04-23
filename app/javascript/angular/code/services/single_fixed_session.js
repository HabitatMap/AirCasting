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
      measurementsToTime: function(measurements) {
        var x;
        var result = {};
        // 1 hour subtraction is a quick and dirty fix for the winter time - should be fixed properly
        var start_date = new Date(this.startTime()).getTime();

        result[start_date + ""] = {
          x: start_date,
          y: null,
          latitude: null,
          longitude: null
        };

        _(measurements).each(function(measurement) {
          x = moment(measurement.time, "YYYY-MM-DDTHH:mm:ss")
            .utcOffset(0, true)
            .valueOf();
          result[x + ""] = {
            x: x,
            y: measurement.value,
            latitude: measurement.latitude,
            longitude: measurement.longitude
          };
        });
        return result;
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
