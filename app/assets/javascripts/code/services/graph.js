angular.module("aircasting").factory('graph', ['$rootScope', 'singleSession', 'sensors',
                                     'heat', 'graphHighlight',
                                     function($rootScope, singleSession, sensors,
                                              heat, graphHighlight) {
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
     var options = {
        chart : {
          renderTo : this.id,
          height : 200,
          spacingTop: 5,
          spacingBottom: 5,
          spacingRight: 0,
          spacingLeft: 0,
          marginBottom: 15,
          marginRight: 5,
          marginLeft: 5,
          borderRadius: 0,
          borderColor: '#858585',
          borderWidth: 2,
          events : {
            load: _(this.onLoad).bind(this)
          },
          zoomType: "x"
        },
        labels: {
          style: {
            fontFamily: "Arial,sans-serif"
          }
        },
        credits: {
            enabled: false
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
            count: 1,
            type: 'minute',
            text: '1min'
          }, {
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
          selected: 4
        },
        series : [{
          name : sensor.measurement_type,
          data : data
        }],
        plotOptions: {
          line: {
            lineColor: "#FFFFFF",
            turboThreshold: 9999999, //above that graph will not display,
            marker: {
              fillColor: '#007BF2',
              lineWidth: 0,
              lineColor: '#007BF2'
            }
          }
        },
        tooltip: {
          style: {
            color: '#000000',
            fontFamily: "Arial,sans-serif"
          },
          borderWidth: 0,
          formatter: function() {
            var pointData = this.points[0];
            var series = pointData.series;
            var s = '<span>'+ Highcharts.dateFormat("%m/%d/%Y", this.x) + " ";
            if(series.hasGroupedData){
              var groupingDiff = moment.duration(series.currentDataGrouping.unitRange,
                                   series.currentDataGrouping.unitName).milliseconds();
              s += Highcharts.dateFormat("%H:%M:%S", this.x - groupingDiff) +'-';
              s += Highcharts.dateFormat("%H:%M:%S", this.x + groupingDiff) +'</span>';
              self.onMouseOverMultiple();
            } else {
              s += Highcharts.dateFormat("%H:%M:%S", this.x) +'</span>';
              self.onMouseOverSingle({latitude: parseFloat(pointData.point.latitude),
                                     longitude: parseFloat(pointData.point.longitude)});
            }
            s += '<br/>' +  sensor.measurement_type + ' = ' + Math.round(pointData.y) +' ' + sensor.unit_symbol;
            return s;
          }
        },
        xAxis: {
          labels: {
            style: {
              color: "#000"
            }
          }
        },
        yAxis : {
          min: heat.getValue("lowest"),
          max: heat.getValue("highest"),
          startOnTick: false,
          endOnTick: false,
          plotBands : [],
          labels: {
            style: {
              color: "#000"
            }
          },
          gridLineWidth: 0
        }
      };
      _(heat.toLevels()).each(function(level){
        options.yAxis.plotBands.push({
          from : level.from,
          to : level.to,
          color : level.color
        });
      });
      this.loaded = false;
      //TODO:
      //to speed up graph provide data as array not object
      this.destroy();
      this.chart = new Highcharts.StockChart(options);
    },

    onLoad: function() {
      this.loaded = true;
    },

    destroy: function() {
      if(this.chart) {
        this.chart.destroy();
        delete this.chart;
      }
    },

    update: function() {
      if(this.chart) {
        this.chart.redraw();
      }
    },

    onMouseOverSingle: function(point) {
      graphHighlight.show(point);
    },
    onMouseOverMultiple: function(start, end) {
      //TODO
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


