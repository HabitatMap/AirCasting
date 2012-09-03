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
     var options = {
        chart : {
          renderTo : this.id,
          events : {
            load: this.onLoad
          },
          zoomType: "x"
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
            s += '<br/>' +  sensor.measurement_type + ' = ' + pointData.y +' ' + sensor.unit_symbol;
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
      //TODO:
      //to speed up graph provide data as array not object
      this.chart = new Highcharts.StockChart(options);
    },

    onLoad: function() {
      this.loaded = true;
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


