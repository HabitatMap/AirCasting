angular.module("aircasting").factory('sessions',
       ['params', '$http', 'map','sensors', '$rootScope',
         'heat', 'spinner',  'utils',
        function(params, $http, map, sensors, $rootScope,
                 heat, spinner, utils) {
  var Sessions = function() {
    this.sessions = [];
    var self = this;
    this.scope = $rootScope.$new();
    this.scope.params = params;
    this.scope.$watch("params.get('sessionsIds')", function(newIds, oldIds) {
      _(newIds).chain().difference(oldIds).each(_(self.selectSession).bind(self));
      _(oldIds).chain().difference(newIds).each(_(self.deselectSession).bind(self));
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
      var self = this;
      if(!data.time) {
        return;
      }
      var reqData = {
        time_from: data.time.timeFrom - utils.timeOffset,
        time_to:  data.time.timeTo - utils.timeOffset,
        day_from:  data.time.dayFrom,
        day_to:  data.time.dayTo,
        year_from:  data.time.yearFrom,
        year_to:  data.time.yearTo,
        tags:  data.tags,
        usernames:  data.usernames
      };
      var location = data.location;
      if(location.limit){
        _(reqData).extend({
          west: viewport.west,
          east: viewport.east,
          south: viewport.south,
          north: viewport.north
        });
      }

      if(!location.limit && location.address) {
        _(reqData).extend({
          location:  location.address,
          distance:  location.distance
        });
      }
      if(sensors.selected()){
        _(reqData).extend({
          sensor_name:  sensors.selected().sensor_name,
          measurement_type:  sensors.selected().measurement_type
        });
      }

      this.clear();
      this.sessions = [];
      spinner.show();
      $http.get('/api/sessions.json', {cache: true, params : {q: reqData}}).success(_(this.onSessionsFetch).bind(this));
    },

    onSessionsFetch: function(data, status, headers, config) {
      var times;
      _(data).each(function(session){
        if(session.start_time_local && session.end_time_local) {
          times = [moment(session.start_time_local, "YYYY-MM-DDTHH:mm:ss"),
                   moment(session.end_time_local, "YYYY-MM-DDTHH:mm:ss")];
          if(session.start_time_local > session.end_time_local){
            times = _(times).reverse();
          }
          session.timeframe = times[0].format('MM/DD/YYYY, HH:mm') +
            '-' +  times[1].format('HH:mm');
        }
        session.shortTypes = _(session.streams).chain().map(function(stream){
          return {name: stream.measurement_short_type, type: stream.sensor_name};
        }).sortBy(function(shortType) {
          return shortType.name.toLowerCase();
        }).value();
      });
      this.sessions = data;
      spinner.hide();
      this.reSelectAllSessions();
    },

    find: function(id) {
      return _(this.sessions || []).detect(function(session){
        return session.id === id;
      });
    },

    redraw: function() {
      var self = this;
      this.clear();
      _(this.allSelected()).each(_(this.draw).bind(this));
    },

    clear: function() {
      _(this.sessions).each(_(this.undoDraw).bind(this));
    },

    deselectSession: function(id) {
      var self = this;
      var session = this.find(id);
      if(!session || !session.drawed){
        return;
      }
      this.undoDraw(session);
    },

    selectSession: function(id) {
      var self = this;
      var session = this.find(id);
      if(!session){
        return;
      }
      if(session.loaded){
        if(!session.drawed) {
          this.draw(session);
        }
        return;
      }
      spinner.show();
      $http.get('/api/sessions/' +  id, {cache : true}).success(function(data, status, headers, config){
        self.onSingleSessionFetch(session, data);
      });
    },

    reSelectAllSessions: function(){
      var self = this;
      _(params.get('sessionsIds')).each(function(id){
        self.selectSession(id);
      });
    },

    isSelected: function(session) {
      return _(this.allSelected()).include(session);
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
      spinner.hide();
    },

    draw: function(session) {
      if(!session || !session.loaded){
        return;
      }
      this.undoDraw(session);
      var suffix = ' ' + sensors.anySelected().unit_symbol;
      session.markers = [];
      session.notes = [];
      session.lines = [];
      var points = [];
      _(this.measurements(session)).each(function(measurment, idx){
        var value = _.str.toNumber(measurment.value);
        var level = heat.getLevel(value);
        if(level){
          session.markers.push(map.drawMarker(measurment, {
            title: parseInt(measurment.value, 10).toString() + suffix,
            zIndex: idx,
            icon: "/assets/marker"+ level + ".png"
          }));
          points.push(measurment);
        }
      });
      _(session.details.notes || []).each(function(note){
        session.notes.push(map.drawNote(note));
      });
      session.lines.push(map.drawLine(points));

      map.appendViewport(this.getBounds());
      session.drawed = true;
    },

    undoDraw: function(session) {
      _(session.markers || []).each(function(marker){
        map.removeMarker(marker);
      });
      _(session.lines || []).each(function(line){
        map.removeMarker(line);
      });
      _(session.notes || []).each(function(note){
        map.removeMarker(note);
      });
    },

    getBounds: function() {
       var north,  east, south, west, lat, lng;
       var self = this;
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

