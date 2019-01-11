import _ from 'underscore';
import { debounce } from 'debounce';
import constants from '../constants';

export const fixedSessions = (
  params,
  $http,
  map,
  sensors,
  $rootScope,
  utils,
  sessionsDownloader,
  drawSession,
  boundsCalculator,
  sessionsUtils,
  $location
) => {
  var FixedSessions = function() {
    this.sessions = [];
    this.scope = $rootScope.$new();
    this.scope.params = params;
  };

  let prevMapPosition = {
    bounds: map.getBounds(),
    zoom: map.getZoom()
  };

  FixedSessions.prototype = {
    hasSelectedSessions: function() {
      return this.noOfSelectedSessions() > 0;
    },

    allSelected: function() { return sessionsUtils.allSelected(this); },

    allSelectedIds: function() { return sessionsUtils.allSelectedIds(); },

    allSessionIds: function() { return sessionsUtils.allSessionIds(this) },

    deselectAllSessions: function() { sessionsUtils.deselectAllSessions(); },

    export: function() { sessionsUtils.export(this); },

    find: function(id) { return sessionsUtils.find(this, id); },

    get: function(){ return sessionsUtils.get(this); },

    isSelected: function(session) { return sessionsUtils.isSelected(this, session); },

    noOfSelectedSessions : function() { return sessionsUtils.noOfSelectedSessions(this); },

    onSessionsFetchError: function(data){ sessionsUtils.onSessionsFetchError(data); },

    reSelectAllSessions: function() { sessionsUtils.reSelectAllSessions(this); },

    selectAllSessions: function() { sessionsUtils.selectAllSessions(this); },

    sessionsChanged: function (newIds, oldIds) { sessionsUtils.sessionsChanged(this, newIds, oldIds); },



    onSessionsFetch: function() {
      this.drawSessionsInLocation();
      sessionsUtils.onSessionsFetch(this);
    },

    deselectSession: function(id) {
      var session = this.find(id);
      if(!session) return;
      session.loaded = false;
      session.$selected = false;
      session.alreadySelected = false;
      map.fitBounds(prevMapPosition.bounds, prevMapPosition.zoom);
    },

    selectSession: function(id) {
      const session = this.find(id);
      const allSelected = this.allSelected();
      const fitBounds = () => {
        if (!session.is_indoor) {
          prevMapPosition = {
            bounds: map.getBounds(),
            zoom: map.getZoom()
          };
          map.fitBounds(boundsCalculator(allSelected));
        }
      };
      this._selectSession(id, fitBounds);
    },

    reSelectSession: function(id) {
      const noop = () => {};
      this._selectSession(id, noop);
    },

    _selectSession: function(id, callback) {
      var session = this.find(id);
      if(!session || session.alreadySelected) return;
      var sensorId = sensors.selectedId() || sensors.tmpSelectedId();
      var sensor = sensors.sensors[sensorId] || {};
      var sensorName = sensor.sensor_name;
      if (!sensorName) return;
      session.alreadySelected = true;
      session.$selected = true;
      $http.get('/api/realtime/sessions/' + id, {
        cache : true,
        params: { sensor_id: sensorName }
      }).success(function(data){
        sessionsUtils.onSingleSessionFetch(session, data, callback);
      });
    },

    downloadSessions: function(url, reqData) {
      sessionsDownloader(url, reqData, this.sessions, params, _(this.onSessionsFetch).bind(this),
        _(this.onSessionsFetchError).bind(this));
    },

    drawSessionsInLocation: function() {
      map.markers = [];
      (this.get()).forEach(session => drawSession.drawFixedSession(session));
    },

    _fetch: function(page) {
      // if _fetch is called after the route has changed (eg debounced)
      if ($location.path() !== constants.fixedMapRoute) return;

      const data = params.get('data');

      // _.values suggests that `params.get('selectedSessionIds')` could be an obj, is it true?
      const sessionIds = _.values(params.get('selectedSessionIds') || []);

      if (!data.time) return;

      var reqData = {
        time_from: data.time.timeFrom - utils.timeOffset,
        time_to:  data.time.timeTo - utils.timeOffset,
        day_from:  data.time.dayFrom,
        day_to:  data.time.dayTo,
        year_from:  data.time.yearFrom,
        year_to:  data.time.yearTo,
        tags:  data.tags,
        usernames:  data.usernames,
        session_ids: sessionIds
      };

      if(data.location.indoorOnly) {
        reqData = { ...reqData, is_indoor: true };
      } else {
        _(reqData).extend({
          west: map.getBounds().west,
          east: map.getBounds().east,
          south: map.getBounds().south,
          north: map.getBounds().north
        });
      }

      if(sensors.selected()){
        _(reqData).extend({
          sensor_name:  sensors.selected().sensor_name,
          measurement_type:  sensors.selected().measurement_type,
          unit_symbol:  sensors.selected().unit_symbol,
        });
      }

      _(params).extend({page: page});

      drawSession.clear(this.sessions);

      if (page === 0) {
        this.sessions = [];
        this.downloadSessions('/api/realtime/multiple_sessions.json', reqData);
      }

      if (data.location.streaming) {
        this.downloadSessions('/api/realtime/streaming_sessions.json', reqData);
      } else {
        this.downloadSessions('/api/realtime/sessions.json', reqData);
      }
    },

    fetch: debounce(function(page) { this._fetch(page) }, 750)
  };
  return new FixedSessions();
};
