angular.module("aircasting").factory('plotStorage', ['params', '$rootScope', 'sessions', 'sensors','heat',
                                     function(params, $rootScope, sessions, sensors, heat) {
  var PlotStorage = function() {
    var self = this;
    this.scope = $rootScope.$new();
    this.scope.params = params;
    this.scope.shouldRedraw = function() {
      return _(params.get('sessionsIds')).size() == 1 &&
        !!sensors.anySelected() &&
          !!sessions.find(_(params.get('sessionsIds')).first()).details;
    };
    this.scope.$watch("shouldRedraw()", function(ready) {
      if(ready) {
        self.redraw();
      }
    }, true);
  };
  PlotStorage.prototype = {
    get: function(data) {
      if(!this.plot){
        return;
      }
      return this.plot;
    },
    getEdge: function(edge) {
      //edge can be min or max
      if(!this.plot || _(this.plot.getData()).isEmpty()){
        return;
      }
      return _(this.plot.getData()).first().xaxis[edge];
    },
    set : function(plot){
      this.plot = plot;
    },
    redraw: function() {
      if(!sessions.withStream()) {
        return;
      }
      var correctedData = sessions.selectedMeasurementsToTime();
      var first = _(correctedData).first()[0];
      var last = _(correctedData).last()[0];
      var options = this.plot.getOptions();
      options.xaxis.panRange = [first, last];
      options.xaxis.zoomRange = [null, last - first];
      options.yaxis.min = _.first(heat.toList(params.get('data').heat));
      options.yaxis.max = _.last(heat.toList(params.get('data').heat));
      this.plot.setData([{data: correctedData}]);
      this.plot.setupGrid();
      this.plot.draw();
    }
  };
  return new PlotStorage();
}]);


