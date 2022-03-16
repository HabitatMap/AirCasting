import { isJSON, getParams2, updateParams } from "./params";
import _ from "underscore";

const params = () => {
  var Params = function () {
    this.init(getParams2());
  };
  Params.prototype = {
    init: function (searchData) {
      _(searchData || {}).each(function (value, key) {
        if (isJSON(value)) {
          searchData[key] = JSON.parse(value);
        } else {
          searchData[key] = value;
        }
      });
      this.paramsData = searchData || {};
    },
    get: function (name, defaultValue) {
      return this.paramsData[name] || defaultValue || {};
    },
    update: function (newParams) {
      const newData = deepMerge(
        deepClone(this.paramsData || {}),
        deepClone(newParams)
      );
      this.paramsData = deepClone(newData);
      _(newData).each(function (value, key) {
        newData[key] = JSON.stringify(value);
      });

      updateParams(newData);
      this.init(newData);
    },
    updateFromDefaults: function (defaults) {
      this.update({ data: { ...defaults, ...this.paramsData.data } });
    },
    updateData: function (newData) {
      const newD = deepMerge(
        deepClone(this.paramsData.data || {}),
        deepClone(newData)
      );
      this.update({ data: newD });
    },
    isCrowdMapOn: function () {
      return this.paramsData.data.crowdMap;
    },
    selectedStreamId: function() {
      return this.paramsData["selectedStreamId"] || null;
    },
    isActive: function () {
      return this.paramsData.data.isActive || false;
    },
    isSessionSelected: function () {
      return !!this.selectedStreamId();
    },
  };
  return new Params();
};

export default params();

const deepClone = (x) => JSON.parse(JSON.stringify(x));
const deepMerge = (...objects) => {
  const isObject = (obj) => obj && typeof obj === "object";

  return objects.reduce((prev, obj) => {
    Object.keys(obj).forEach((key) => {
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
