angular.module("aircasting").factory('params', ['$location', '$rootScope', 'utils',
                                     function($location, $rootScope, utils) {
  var Params = function() {
    this.scope = $rootScope.$new();
    //set init params
    this.init($location.search());
    this.startupData = angular.copy(this.paramsData);
    this.scope.$location = $location;
    this.scope.$watch("$location.search()", _(this.init).bind(this));
  };
  Params.prototype = {
    init: function(searchData) {
      console.log("watch - $location.search()");
      _(searchData || {}).each(function(value, key){
        searchData[key] = angular.fromJson(value);
      });
      if(angular.equals(this.paramsData, searchData)){
        return;
      }
      this.paramsData = searchData || {};
    },
    get: function(name, defaultValue){
      return this.paramsData[name] || defaultValue || {};
    },
    getWithout: function(name, exception){
      var result = angular.copy(this.get(name));
      delete result[exception];
      return result;
    },
    update: function(newParams) {
      var newData = utils.merge(this.paramsData || {}, newParams);
      this.paramsData = angular.copy(newData);
      _(newData).each(function(value, key){
        newData[key] =  angular.toJson(value);
      });
      $location.search(newData);
    },
    updateFromDefaults : function(defaults) {
      this.update({data: filterAlreadySetParams(defaults, this.paramsData.data)});
    }
  };
  return new Params();
}]);


const filterAlreadySetParams = (defaults, currentParamsData = {}) => {
  return Object.keys(defaults).reduce((acc, key) => {
    if (paramNotSet(key, currentParamsData)) {
      acc[key] = defaults[key];
    };
    return acc;
  }, {});
};

const paramNotSet = (param, currentParamsData) => !(param in currentParamsData)
