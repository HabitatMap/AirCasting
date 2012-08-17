angular.module("aircasting").factory('singleSession', ['sessions', 'map','sensors',
                                     function(sessions, map, sensors) {
  var SingleSession = function() {
  };
  SingleSession.prototype = {
    isSingle : function() {
      return this.noOfSelectedSessions() == 1;
    },
    noOfSelectedSessions : function() {
      return sessions.allSelected().length;
    },
    get: function() {
      return _(sessions.allSelected()).first();
    },
    withSelectedSensor: function(){
      return !!this.get().details.streams[sensors.anySelected().sensor_name];
    },
    measurements: function(){
      return  _(sessions.measurementsForSensor(this.get(), sensors.anySelected().sensor_name));
    },
    measurementsToTime: function(){
      return  _(this.measurements()).map(function(measurement){
        return [moment(measurement.time).valueOf(), measurement.value];
      });
    }
  };
  return new SingleSession();
}]);

