angular.module("aircasting").factory('sessionsUtils', [
  'params',
  'sensors',
  "$timeout",
  'flash',
  'sessionsExporter',
  function(
    params,
    sensors,
    $timeout,
    flash,
    sessionsExporter
  ) {
    return {
      sessionsChanged: function (self, newIds, oldIds) {

        _(newIds).chain().difference(oldIds).each(_(self.selectSession).bind(self));
        _(oldIds).chain().difference(newIds).each(_(self.deselectSession).bind(self));
      },

      get: function(self) {
        return _.uniq(self.sessions, 'id');
      },

      allSessionIds: function(self) {
        return _(self.get()).pluck("id");
      },

      noOfSelectedSessions: function(self) {
        return self.allSelected().length;
      },

      empty: function(self) {
        return self.noOfSelectedSessions() === 0;
      },

      export: function(self) {
        sessionsExporter(self.allSessionIds());
      },

      onSessionsFetch: function(self) {
        self.reSelectAllSessions();
      },

      onSessionsFetchError: function(data){
        var errorMsg = data.error || 'There was an error, sorry' ;
        flash.set(errorMsg);
      },

      find: function(self, id) {
        return _(self.sessions || []).detect(function(session){
          return session.id === id;
        });
      },

      deselectAllSessions: function() {
        params.update({sessionsIds: []});
      },

      selectAllSessions: function(self) {
        params.update({sessionsIds: self.allSessionIds()});
      },

      reSelectAllSessions: function(self){
        _(params.get('sessionsIds')).each(function(id){
          self.reSelectSession(id);
        });
      },

      isSelected: function(self, session) {
        return _(self.allSelected()).include(session);
      },

      allSelected: function(self){
        return _(self.allSelectedIds()).chain().map(function(id){
          return self.find(id);
        }).compact().value();
      },

      allSelectedIds: function() {
        return params.get('sessionsIds');
      },

      measurementsCount: function(session) {
        return session.streams[sensors.selected().sensor_name].measurements_count;
      },

      onSingleSessionFetch: function(session, data, callback) {
        var streams = data.streams;
        delete data.streams;
        _(session).extend(data);
        _(session.streams).extend(streams);
        session.loaded = true;
        callback();
      }
    };
}]);

