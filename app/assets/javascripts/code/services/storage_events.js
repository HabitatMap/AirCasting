angular.module("aircasting").factory('storageEvents', ['storage', '$rootScope', 'utils', 'digester',
                                     function(storage, $rootScope, utils, digester) {
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
    },

    onHighestInput: function() {
      var newValue =  storage.get('heat').highest;
      if(newValue <= storage.get('heat').high) {
         storage.setInHash('heat', "high", newValue - 2);
         self.onHighInput();
      }
    },
    onHighInput: function() {
      var newValue =  storage.get('heat').high;
      if(newValue >= storage.get('heat').highest) {
         storage.setInHash('heat', "highest", newValue + 2);
         self.onHighestInput();
      }
      if(newValue <= storage.get('heat').mid) {
         storage.setInHash('heat', "mid", newValue - 2);
         self.onMidInput();
      }
    },
    onMidInput: function() {
      var newValue =  storage.get('heat').mid;
      if(newValue >= storage.get('heat').high) {
         storage.setInHash('heat', "high", newValue + 2);
         self.onHighInput();
      }
      if(newValue <= storage.get('heat').low) {
         storage.setInHash('heat', "low", newValue - 2);
         self.onLowInput();
      }
    },
    onLowInput: function() {
      var newValue =  storage.get('heat').low;
      if(newValue >= storage.get('heat').mid) {
         storage.setInHash('heat', "mid", newValue + 2);
         self.onMidInput();
      }
      if(newValue <= storage.get('heat').lowest) {
         storage.setInHash('heat', "lowest", newValue - 2);
         self.onLowestInput();
      }
    },
    onLowestInput: function() {
      var newValue =  storage.get('heat').lowest;
      if(newValue >= storage.get('heat').low) {
         storage.setInHash('heat', "low", newValue + 2);
         self.onLowInput();
      }
    }
  };
  self = new StorageEvents();
  return self;
}]);
