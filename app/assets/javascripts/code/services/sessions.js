angular.module("aircasting").factory('sessions',
       ['params', '$http', 'map','sensors', '$rootScope',
         'heat', 'spinner',  'utils', "$timeout",
        function(params, $http, map, sensors, $rootScope,
                 heat, spinner, utils, $timeout) {
  var Sessions = function() {
    this.sessions = [];
    this.maxPoints = 30000;
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

    canSelectThatSession: function(session) {
      return (this.totalMeasurementsSelectedCount() + this.measurementsCount(session)) <= this.maxPoints;
    },

    canSelectAllSessions: function(session) {
      return this.totalMeasurementsCount() <= this.maxPoints;
    },

    empty: function() {
      return this.noOfSelectedSessions() === 0;
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
      var sessionIds = _(params.get('sessionsIds') || []);
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
        session.$selected = sessionIds.include(session.id);
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
      var session = this.find(id);
      if(!session){
        return;
      }
      session.$selected = false;
      this.undoDraw(session);
    },

    deselectAllSessions: function() {
      params.update({sessionsIds: []});
    },

    selectAllSessions: function() {
      params.update({sessionsIds: _(this.get()).pluck("id")});
    },
    selectSession: function(id) {
      var self = this;
      var session = this.find(id);
      session.$selected = true;
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

    measurementsCount: function(session) {
      return session.streams[sensors.selected().sensor_name].measurements_count;
    },

    totalMeasurementsSelectedCount: function() {
      var self = this;
      return _(this.allSelected()).reduce(function(memo, session){
        return memo + self.measurementsCount(session);
      }, 0);
    },

    totalMeasurementsCount: function() {
      var self = this;
      return _(this.get()).reduce(function(memo, session){
        return memo + self.measurementsCount(session);
      }, 0);
    },

    measurementsForSensor: function(session, sensor_name){
      return session.streams[sensor_name].measurements;
    },

    measurements: function(session){
      return this.measurementsForSensor(session, sensors.anySelected().sensor_name);
    },

    allStreams: function(sensor_name){
      var self = this;
      return _(this.allSelected()).map(function(session){
        return session.streams[sensor_name];
      });
    },

    onSingleSessionFetch: function(session, data) {
      _(session).extend(data);
      session.loaded = true;
      this.draw(session);
      $timeout(function(){
        spinner.hide();
      });
    },

    draw: function(session) {
      if(!session || !session.loaded || !sensors.anySelected()){
        return;
      }
      this.undoDraw(session, true);
      var suffix = ' ' + sensors.anySelected().unit_symbol;
      session.markers = [];
      session.noteDrawings = [];
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
      _(session.notes || []).each(function(note, idx){
        session.noteDrawings.push(map.drawNote(note, idx));
      });
      session.lines.push(map.drawLine(points));

      session.drawed = true;
      map.appendViewport(this.getBounds());
    },

    undoDraw: function(session, noMove) {
      if(!session.drawed){
        return;
      }
      _(session.markers || []).each(function(marker){
        map.removeMarker(marker);
      });
      _(session.lines || []).each(function(line){
        map.removeMarker(line);
      });
      _(session.noteDrawings || []).each(function(note){
        map.removeMarker(note);
      });
      session.drawed = false;
      if(!noMove){
        map.appendViewport(this.getBounds());
      }
    },

    getBounds: function() {
       var north,  east, south, west, lat, lng;
       var self = this;
       var sensor = sensors.anySelected();
       if(!sensor) {
         return;
       }
       _(this.allStreams(sensor.sensor_name)).each(function(s){
         if(!north || s.min_latitude < north) { north = s.min_latitude; }
         if(!west  || s.min_longitude < west) { west = s.min_longitude; }
         if(!south || s.max_latitude > south) { south = s.max_latitude; }
         if(!east  || s.max_longitude > east) { east = s.max_longitude ; }
       });
       if(!north){
         return;
       }
       return {north: north, east: east, south : south, west: west};
     }
  };
  return new Sessions();
}]);

