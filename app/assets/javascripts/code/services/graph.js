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
        labels: {
          style: {
            fontFamily: "Arial,sans-serif"
          }
        },
        navigator : {
          enabled : false
        },
        rangeSelector : {
          buttonSpacing: 5,
          buttonTheme: {
            width: 50
          },
          buttons: [{
            count: 5,
            type: 'minute',
            text: '5min'
          }, {
            count: 30,
            type: 'minute',
            text: '30min'
          }, {
            count: 1,
            type: 'hour',
            text: '1hr'
          }, {
            type: 'all',
            text: 'All'
          }],
          inputEnabled: false,
          selected: 3
        },
        series : [{
          name : sensor.measurement_type,
          data : data,
          tooltip: {
            valueDecimals: 2
          }
        }],
        plotOptions: {
          line: {
            lineColor: "#FFFFFF"
          }
        },
        tooltip: {
          borderWidth: 0,
          formatter: function() {
                var s = '<b>'+ Highcharts.dateFormat('%d/%m/%Y %H:%M:%S', this.x) +'</b>';

                $.each(this.points, function(i, point) {
                    s += '<br/>' + sensor.measurement_type + ' : '+ point.y + '' + sensor.unit_symbol;
                });

                return s;
            }
        },
        yAxis : {
          plotBands : [],
          labels: {
            enabled : false
          },
          gridLineWidth: 0
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


