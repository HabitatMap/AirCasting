function HeatCtrl($scope, sensors, storage, storageEvents) {
  $scope.storage = storage;
  $scope.storageEvents = storageEvents;
  $scope.sensors = sensors;
  $scope.heatPercentage = {};

  $scope.$watch("storage.data.heat", function(newValue, oldValue) {
    if(!newValue){
      return;
    }
    var value = newValue;
    var scale =  value.highest - value.lowest;
    var percentageHeat = {
     highest: Math.round(((value.highest - value.high) / scale) * 100),
     high :  Math.round(((value.high - value.mid) / scale) * 100),
     mid : Math.round(((value.mid - value.low) / scale) * 100)
    };
    percentageHeat.low =  (100 - percentageHeat.highest - percentageHeat.high - percentageHeat.mid);
    _(["highest", "high", "mid", "low"]).each(function(heat){
      $scope.heatPercentage[heat] = {width: percentageHeat[heat] + "%"};
    });
  }, true);
}
HeatCtrl.$inject = ['$scope', 'sensors', 'storage', 'storageEvents'];
