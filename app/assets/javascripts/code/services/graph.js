angular.module("aircasting").factory('graph', ['$rootScope', 'singleSession', 'sensors','heat', 'graphHighlight',
                                     function($rootScope, singleSession, sensors, heat, graphHighlight) {
  var Graph = function() {
  };
  Graph.prototype = {
    init: function(id){
      this.id = id;
      this.loaded = false;
    },
    draw : function(data){
     var sensor = sensors.anySelected();
     var self = this;
     _(data).each(function(item){
       item.events = {mouseOver: self.onMouseOver, onmouseOut: self.onMouseOut};
     });
     var options = {
        chart : {
          renderTo : this.id
          //events : {
          //  load: this.onLoad
          //}
        },
        rangeSelector : {
          buttons: [{
            count: 1,
            type: 'minute',
            text: '1M'
          }, {
            count: 5,
            type: 'minute',
            text: '5M'
          }, {
            type: 'all',
            text: 'All'
          }],
          inputEnabled: false,
          selected: 0
        },
        series : [{
          name : sensor.measurement_type,
          data : data,
          tooltip: {
            valueDecimals: 2
          }
        }],
        yAxis : {
          plotBands : []
        }
      };
      _(heat.toLevels()).each(function(level){
        options.yAxis.plotBands.push({
          from : level.from,
          to : level.to,
          color : level.color,
          label : {
            text : "" + level.to + sensor.unit_symbol
          }
        });
      });
      this.loaded = false;
      this.chart = new Highcharts.StockChart(options);
    },

    onLoad: function() {
      this.loaded = true;
    },

    onMouseOver: function() {
      graphHighlight.show(this);
    },

    onMouseOut: function() {
      graphHighlight.hide(this);
    },

    redraw: function() {
      if(!singleSession.withSelectedSensor()) {
        return;
      }
      this.draw(singleSession.measurementsToTime());
    }
  };
  return new Graph();
}]);


