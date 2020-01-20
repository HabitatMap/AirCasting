import { isJSON } from "../../../javascript/params";
import deepEqual from "fast-deep-equal";

angular.module("aircasting").factory("params", [
  "$location",
  function($location) {
    var Params = function() {
      this.init($location.search());
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
      update: function(newParams) {
        const newData = deepMerge(
          deepClone(this.paramsData || {}),
          deepClone(newParams)
        );
        this.paramsData = deepClone(newData);
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
        const newD = deepMerge(
          deepClone(this.paramsData || {}),
          deepClone(newData)
        );
        this.update({ data: newD });
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

const deepClone = x => JSON.parse(JSON.stringify(x));
const deepMerge = (...objects) => {
  const isObject = obj => obj && typeof obj === "object";

  return objects.reduce((prev, obj) => {
    Object.keys(obj).forEach(key => {
      const pVal = prev[key];
      const oVal = obj[key];

      if (Array.isArray(pVal) && Array.isArray(oVal)) {
        prev[key] = oVal; //pVal.concat(...oVal);
      } else if (isObject(pVal) && isObject(oVal)) {
        prev[key] = deepMerge(pVal, oVal);
      } else {
        prev[key] = oVal;
      }
    });

    return prev;
  }, {});
};
