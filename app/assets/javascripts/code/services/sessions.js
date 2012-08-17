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
    noOfSelectedSessions : function() {
      return this.allSelected().length;
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
    },

    find: function(id) {
      return _(this.sessions).detect(function(session){
        return session.id === id;
      });
    },

    fetchSingle: function(id) {
      var self = this;
      var session = this.find(id);
      if(session.loaded){
        return;
      }
      $http.get('/api/sessions/' +  id).success(function(data, status, headers, config){
        self.onSingleSessionFetch(session, data);
      });
    },

    allSelected: function(){
      var self = this;
      return _(params.get('sessionsIds')).chain().map(function(id){
        return self.find(id);
      }).compact().value();
    },

    measurementsForSensor: function(session, sensor_name){
      return session.details.streams[sensor_name].measurements;
    },

    measurements: function(session, sensor_name){
      return session.details.streams[sensors.anySelected().sensor_name].measurements;
    },

    allMeasurements: function(sensor_name){
      var self = this;
      return _(this.allSelected()).chain().map(function(session){
        return self.measurements(session, sensor_name);
      }).flatten().value();
    },

    onSingleSessionFetch: function(session, data) {
      session.details = data;
      session.loaded = true;
      if(sensors.anySelected()){
        this.draw(session);
      }
    },

    draw: function(session) {
      var measurments = this.measurements(session);
      var suffix = ' ' + sensors.anySelected().unit_symbol;
      _(measurments).each(function(measurment, idx){
        map.drawMarker(measurment, {title: parseInt(measurment.value, 10).toString() + suffix, zIndex: idx} );
      });
      map.appendViewport(this.getBounds());
      session.drawed = true;
    },
    getBounds: function() {
       var north,  east, south, west, lat, lng;
       var self = this;
       console.log(sensors.anySelected().sensor_name, this.allMeasurements(sensors.anySelected().sensor_name));
       _(this.allMeasurements(sensors.anySelected().sensor_name)).each(function(m){
         lat = parseFloat(m.latitude);
         lng = parseFloat(m.longitude);
         if(!north || lat > north){ north = lat; }
         if(!east || lng > east){  east = lng ; }
         if(!south || lat < south){  south = lat; }
         if(!west || lng < west){  west = lng ; }
       });
       return {north: north, east: east, south : south, west: west};
     }
  };
  return new Sessions();
}]);

