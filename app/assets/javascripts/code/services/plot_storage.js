angular.module("aircasting").factory('plotStorage', ['$rootScope', 'singleSession', 'sensors','heat',
                                     function($rootScope, singleSession, sensors, heat) {
  var PlotStorage = function() {
    var self = this;
    this.scope = $rootScope.$new();
    this.scope.shouldRedraw = function() {
      return singleSession.isSingle() && !!sensors.anySelected() && !!singleSession.get().loaded;
    };
    this.scope.$watch("shouldRedraw()", function(ready) {
      if(ready){self.redraw();}
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
      if(!singleSession.withSelectedSensor()) {
        return;
      }
      var correctedData = singleSession.measurementsToTime();
      var first = _(correctedData).first()[0];
      var last = _(correctedData).last()[0];
      var options = this.plot.getOptions();
      options.xaxis.panRange = [first, last];
      options.xaxis.zoomRange = [null, last - first];
      options.yaxis.min = _.first(heat.toList());
      options.yaxis.max = _.last(heat.toList());
      this.plot.setData([{data: correctedData}]);
      this.plot.setupGrid();
      this.plot.draw();
    }
  };
  return new PlotStorage();
}]);


