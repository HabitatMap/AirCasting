angular.module("aircasting").factory('graph', [
  '$q',
  'sensors',
  'singleFixedSession',
  'heat',
  'graphHighlight',
  '$http',
  'promiseStorage',
  function(
    $q,
    sensors,
    singleFixedSession,
    heat,
    graphHighlight,
    $http,
    promiseStorage
  ) {
    var Graph = function(){};

    Graph.prototype = {
      init: function(id){
        this.id = id;
      },

      getInitialData: function() {
        var self = this;
        var end_date = new Date(singleFixedSession.endTime()).getTime();
        var start_date = end_date - (24*60*60*1000);

        $http.get('/api/realtime/stream_measurements/',
          {cache: true,
            params: {
              stream_ids: singleFixedSession.selectedStream().id,
              start_date,
              end_date
            }}).success(function(data){
              self.draw(singleFixedSession.measurementsToTime(data), singleFixedSession.isFixed());
            });
      },

      draw: function(data, isFixed){
        var sensor = sensors.anySelected();
        var self = this;
        var low = heat.getValue("lowest");
        var high = heat.getValue("highest");
        var tick = Math.round((high - low)/ 4);
        var ticks = [low, low + tick, low + 2*tick, high - tick, high];

        var min1  = { count: 1,  type: 'minute', text: '1min'  };
        var min5  = { count: 5,  type: 'minute', text: '5min'  };
        var min30 = { count: 30, type: 'minute', text: '30min' };
        var hr1   = { count: 1,  type: 'hour',   text: '1hr'   };
        var hrs12 = { count: 12, type: 'hour',   text: '12hrs' };
        var hrs24 = { count: 24, type: 'hour',   text: '24hrs' };
        var wk1   = { count: 1,  type: 'week',   text: '1wk'   };
        var mth1  = { count: 1,  type: 'month',  text: '1mth'  };
        var all   = {            type: 'all',    text: 'All'   };

        var buttons, selectedButton;

        buttons = [min1, min5, min30, hr1, hrs12, all];
        selectedButton = 4;

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

            zoomType: "x",
            style: {
              fontFamily: 'Arial, sans-serif',
              fontWeight: 'normal'
            }
          },

          labels: {
            style: {
              fontFamily: 'Arial,sans-serif'
            }
          },

          credits: {
            enabled: false
          },

          navigator : {
            enabled : false
          },

          rangeSelector : {
            height: 23,
            buttonSpacing: 5,
            buttonTheme: {
              width: 50,
              height: 15,
              stroke: '#999999',
              'stroke-width': 1,
              style: {
                fontFamily: 'Arial, sans-serif',
                marginTop: 100
              },

              states: {
                select: {
                  fill: '#D5E9FF'
                }
              }
            },

            labelStyle: {
              fontWeight: 'normal',
              fontFamily: 'Arial, sans-serif'
            },

            buttons: buttons,
            inputEnabled: false,
            selected: selectedButton
          },

          series : [{
            name : sensor.measurement_type,
            data : _(data).values()
          }],

          plotOptions: {
            line: {
              lineColor: "#FFFFFF",
              turboThreshold: 9999999, //above that graph will not display,
              marker: {
                fillColor: '#007BF2',
                lineWidth: 0,
                lineColor: '#007BF2'
              },

              dataGrouping: {
                enabled: true,
                units: [
                  ['millisecond', []],
                  ['second', [2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20, 30, 40, 50]],
                  ['minute', [1, 2, 3, 4, 5]],
                ]
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
                var groupingDiff = series.currentDataGrouping.totalRange;
                var xLess =  this.x;
                var xMore =  this.x + groupingDiff;
                s += Highcharts.dateFormat("%H:%M:%S", xLess) +'-';
                s += Highcharts.dateFormat("%H:%M:%S", xMore - 1000) +'</span>';
                self.onMouseOverMultiple(xLess, xMore);
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
                color: "#000",
                fontFamily: "Arial, sans-serif"
              }
            },
            minRange: 10000,
          },

          yAxis : {
            min: low,
            max:  high,
            startOnTick: true,
            endOnTick: true,
            plotBands : [],
            labels: {
              style: {
                color: "#000",
                fontFamily: "Arial, sans-serif"
              }
            },
            gridLineWidth: 0,
            minPadding: 0,
            tickPositions: ticks
          }
        };

        if (isFixed)
        {
          buttons = [hr1, hrs12, hrs24, wk1, mth1, all];
          selectedButton = 2;
          _.extend(options.rangeSelector, {buttons: buttons, selected: selectedButton});
          _.extend(options.xAxis, {events: {afterSetExtremes: this.afterSetExtremes}, ordinal: false});
          _.extend(options.scrollbar, {liveRedraw: false});
        }

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
        this.data = data;
      },

      onLoad: function() {
        this.loaded = true;
      },

      afterSetExtremes: function(e) {
        var self = this;
        var final_point = {};
        var end_time = new Date(singleFixedSession.endTime()).getTime();
        final_point[end_time + ""] = {x: end_time, y: null, latitude: null, longitude: null};
        self.chart.showLoading('Loading data from server...');

        promiseStorage.push($http.get('/api/realtime/stream_measurements/',
          {cache: true, params: {stream_ids: singleFixedSession.selectedStream().id,
            start_date: Math.round(e.min),
            // winter time fix
            end_date: Math.round(e.max)
          }}).success(function(data) {
            data = _.extend(singleFixedSession.measurementsToTime(data), final_point);
            self.chart.series[0].setData(_(data).values(), false);          
          })
        );

        $q.all(promiseStorage.get()).then(function() {
          promiseStorage.clear();
          self.chart.redraw();
          if ($http.pendingRequests.length === 0) {
            self.chart.hideLoading();
          }
        });
      },

      destroy: function() {
        if (this.chart) {
          this.chart.destroy();
          delete this.chart;
        }
      },

      onMouseLeave: function() {
        graphHighlight.hide();
      },

      onMouseOverSingle: function(point) {
        if (!singleFixedSession.isFixed()) {
          graphHighlight.show([point]);
        }
      },

      onMouseOverMultiple: function(start, end) {
        var startSec = start ;
        var endSec = end ;
        var points = [];
        var point;
        for (var i = startSec; i <= endSec; i = i + 1000){
          point = this.data[i + ""];
          if (point){
            points.push(point);
          }
        }
        var pointNum = Math.floor(points.length / 2);
        graphHighlight.show([points[pointNum]]);
      },
    };

    return new Graph();
  }]);
