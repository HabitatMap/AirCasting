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
      self.doHeatChange($(this), ui.value, "low");
      self.onLowInput();
      $rootScope.$digest();
    },
    onHeatChangeHigh : function(event, ui) {
      self.doHeatChange($(this), ui.value, "high");
      self.onHighInput();
      $rootScope.$digest();
    },
    onHeatChangeMid : function(event, ui) {
      self.doHeatChange($(this), ui.value, "mid");
      self.onMidInput();
      $rootScope.$digest();
    },
    doHeatChange: function(element, value, curr) {
      var currValue = element.slider( "option", "value" );
      if(value == currValue ) {
        return false;
      }
      storage.setInHash("heat", curr, value);
      return true;
    },

    onHighestInput: function() {
      var newValue =  storage.get('heat').highest;
      if(newValue <= storage.get('heat').high) {
         storage.setInHash('heat', "high", newValue - 1);
         self.onHighInput();
      }
    },
    onHighInput: function() {
      var newValue =  storage.get('heat').high;
      if(newValue >= storage.get('heat').highest) {
         storage.setInHash('heat', "highest", newValue + 1);
         self.onHighestInput();
      }
      if(newValue <= storage.get('heat').mid) {
         storage.setInHash('heat', "mid", newValue - 1);
         self.onMidInput();
      }
    },
    onMidInput: function() {
      var newValue =  storage.get('heat').mid;
      if(newValue >= storage.get('heat').high) {
         storage.setInHash('heat', "high", newValue + 1);
         self.onHighInput();
      }
      if(newValue <= storage.get('heat').low) {
         storage.setInHash('heat', "low", newValue - 1);
         self.onLowInput();
      }
    },
    onLowInput: function() {
      var newValue =  storage.get('heat').low;
      if(newValue >= storage.get('heat').mid) {
         storage.setInHash('heat', "mid", newValue + 1);
         self.onMidInput();
      }
      if(newValue <= storage.get('heat').lowest) {
         storage.setInHash('heat', "lowest", newValue - 1);
         self.onLowestInput();
      }
    },
    onLowestInput: function() {
      var newValue =  storage.get('heat').lowest;
      if(newValue >= storage.get('heat').low) {
         storage.setInHash('heat', "low", newValue + 1);
         self.onLowInput();
      }
    }
  };
  self = new StorageEvents();
  return self;
}]);
