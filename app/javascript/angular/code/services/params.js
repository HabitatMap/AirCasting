import { isJSON } from "../../../javascript/params";

angular.module("aircasting").factory("params", [
  "$location",
  "$rootScope",
  "utils",
  function($location, $rootScope, utils) {
    var Params = function() {
      this.scope = $rootScope.$new();
      //set init params
      this.init($location.search());
      this.startupData = angular.copy(this.paramsData);
      this.scope.$location = $location;
      window.__params = this;
    };
    Params.prototype = {
      init: function(searchData) {
        _(searchData || {}).each(function(value, key) {
          if (isJSON(value)) {
            searchData[key] = angular.fromJson(value);
          } else {
            searchData[key] = value;
          }
        });
        if (angular.equals(this.paramsData, searchData)) {
          return;
        }
        this.paramsData = searchData || {};
      },
      get: function(name, defaultValue) {
        return this.paramsData[name] || defaultValue || {};
      },
      getWithout: function(name, exception) {
        var result = angular.copy(this.get(name));
        delete result[exception];
        return result;
      },
      update: function(newParams) {
        var newData = utils.merge(this.paramsData || {}, newParams);
        this.paramsData = angular.copy(newData);
        _(newData).each(function(value, key) {
          newData[key] = angular.toJson(value);
        });
        $location.search(newData);
        this.init(newData);
      },
      updateFromDefaults: function(defaults) {
        this.update({ data: { ...defaults, ...this.paramsData.data } });
      },
      updateData: function(newData) {
        this.update({ data: utils.merge(this.paramsData.data || {}, newData) });
      },
      isCrowdMapOn: function() {
        return this.paramsData.data.crowdMap;
      },
      selectedSessionIds: function() {
        return this.paramsData["selectedSessionIds"] || [];
      },
      isActive: function() {
        return this.paramsData.data.isActive || false;
      },
      isSessionSelected: function() {
        return this.selectedSessionIds().length === 1;
      }
    };
    return new Params();
  }
]);
