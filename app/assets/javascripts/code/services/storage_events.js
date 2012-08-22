angular.module("aircasting").factory('storageEvents', ['storage', '$rootScope', 'utils',
                                     function(storage, $rootScope, utils) {
  return {
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
      storage.setInHash("heat", "low", ui.value);
      //todo: change watcher instead of this line
      storage.set("heat",  angular.copy(storage.data.heat));
      $rootScope.$digest();
    },
    onHeatChangeHigh : function(event, ui) {
      storage.setInHash("heat", "high", ui.value);
      storage.set("heat",  angular.copy(storage.data.heat));
      $rootScope.$digest();
    },
    onHeatChangeMid : function(event, ui) {
      storage.setInHash("heat", "mid", ui.value);
      storage.set("heat",  angular.copy(storage.data.heat));
      $rootScope.$digest();
    }
  };
}]);
