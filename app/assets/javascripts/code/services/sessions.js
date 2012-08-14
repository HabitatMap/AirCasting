angular.module("aircasting").factory('sessions', ['params', '$http', 'map','sensors', '$rootScope',
                                     function(params, $http, map, sensors, $rootScope) {
  var Sessions = function() {
    this.sessions = [];
    var self = this;
    this.scope = $rootScope.$new();
    this.scope.params = params;
    this.scope.$watch("params.get('sessionsIds')", function(newIds, oldIds) {
      _(newIds).chain().difference(oldIds).each(_(self.fetchSingle).bind(self));
    }, true);
  };
  Sessions.prototype = {
    get: function(){
      return this.sessions;
    },
    fetch: function() {
      var viewport = map.viewport();
      var data = params.get('data');
      if(!data.time) {
        return;
      }
      var reqData = {
        west: viewport.west,
        east: viewport.east,
        south: viewport.south,
        north: viewport.north,
        time_from: data.time.timeFrom,
        time_to:  data.time.timeTo,
        day_from:  data.time.dayFrom,
        day_to:  data.time.dayTo,
        year_from: 2011,
        year_to: 2020,
        tags:  data.tags,
        usernames:  data.usernames
      };
      if(sensors.selected()){
        _(reqData).extend({
          sensor_name:  sensors.selected().sensor_name,
          measurement_type:  sensors.selected().measurement_type
        });
      }
      $http.get('/api/sessions.json', {params : {q: reqData}}).success(_(this.onSessionsFetch).bind(this));
    },
    onSessionsFetch: function(data, status, headers, config) {
      _(data).each(function(session){
        if(session.start_time_local && session.end_time_local) {
          session.timeframe = moment(session.start_time_local).format('MM/DD/YYYY, HH:mm') +
            '-' +  moment(session.end_time_local).format('HH:mm');
        }
        session.shortTypes = _(session.streams).chain().map(function(stream){
          return {name: stream.measurement_short_type, type: stream.sensor_name};
        }).sortBy(function(shortType) {
          return shortType.name.toLowerCase();
        }).value();
      });
      this.sessions = data;
      //this.scope.$digest();
    },

    find: function(id) {
      return _(this.sessions).detect(function(session){
        return session.id === id;
      });
    },

    fetchSingle: function(id) {
      var self = this;
      var session = this.find(id);
      if(angular.isDefined(session.details)){
        return;
      }
      $http.get('/api/sessions/' +  id).success(function(data, status, headers, config){
        self.onSingleSessionFetch(session, data);
      });
    },

    onSingleSessionFetch: function(session, data) {
      session.details = data;
    }
  };
  return new Sessions();
}]);

