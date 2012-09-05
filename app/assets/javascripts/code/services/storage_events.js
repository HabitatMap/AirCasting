angular.module("aircasting").factory('storageEvents', ['storage', '$rootScope', 'utils',
                                     function(storage, $rootScope, utils) {
  var StorageEvents = function() {};
  var self;
  StorageEvents.prototype = {
    onResolutionSlide : function(event, ui) {
      storage.set("gridResolution", ui.value);
      $rootScope.$digest();
    },
    onMonthDaySlide : function(event, ui) {
      storage.setInHash("time", "dayFrom", _.min(ui.values));
      storage.setInHash("time", "dayTo", _.max(ui.values));
      $rootScope.$digest();
    },
    onYearSlide : function(event, ui) {
      storage.setInHash("time", "yearFrom", _.min(ui.values));
      storage.setInHash("time", "yearTo", _.max(ui.values));
      $rootScope.$digest();
    },
    onTimeSlide : function(event, ui) {
      storage.setInHash("time", "timeFrom", _.min(ui.values) + utils.timeOffset);
      storage.setInHash("time", "timeTo", _.max(ui.values) + utils.timeOffset);
      $rootScope.$digest();
    },
/*    onHeatChangeLow : function(event, ui) {*/
      //_(self.onHeatChangeLowLite).bind(this)(event, ui);
      //$rootScope.$apply();
    //},
    //onHeatChangeMid : function(event, ui) {
      //_(self.onHeatChangeMidLite).bind(this)(event, ui);
      //$rootScope.$apply();
    //},
    //onHeatChangeHigh : function(event, ui) {
      //_(self.onHeatChangeHighLite).bind(this)(event, ui);
      //$rootScope.$apply();
    /*},*/
    onHeatChangeLow : function(event, ui) {
      self.doHeatChange($(this), ui.value, "low", "lowest", "mid");
    },
    onHeatChangeHigh : function(event, ui) {
      self.doHeatChange($(this), ui.value, "high", "mid", "highest");
    },
    onHeatChangeMid : function(event, ui) {
      self.doHeatChange($(this), ui.value, "mid", "low", "high");
    },
    doHeatChange: function(element, value, curr, prev, next) {
      var max = element.slider( "option", "max" );
      var min = element.slider( "option", "min" );
      var currValue = element.slider( "option", "value" );

      if(min == value ) {
        storage.setInHash("heat", prev, value - 2);
        element.slider( "option", "min", value - 1);
      }
      if(max == value ) {
        storage.setInHash("heat", next, value + 2);
        element.slider( "option", "max", value + 1);
      }
      if(currValue == value) {
        return;
      }
      storage.setInHash("heat", curr, value);
      $rootScope.$digest();
    }
  };
  self = new StorageEvents();
  return self;
}]);
