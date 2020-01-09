export const heat = ($rootScope, params) => {
  var Heat = function() {};

  Heat.prototype = {
    getValue: function(name) {
      return (params.get("data").heat || {})[name];
    },

    getLevel: function(value) {
      if (value < this.getValue("lowest")) {
        return null;
      } else if (value <= this.getValue("low")) {
        return 1;
      } else if (value <= this.getValue("mid")) {
        return 2;
      } else if (value <= this.getValue("high")) {
        return 3;
      } else if (value <= this.getValue("highest")) {
        return 4;
      } else {
        return null;
      }
    },

    levelName: function(value) {
      if (value < this.getValue("lowest")) {
        return "default";
      } else if (value <= this.getValue("low")) {
        return "low";
      } else if (value <= this.getValue("mid")) {
        return "mid";
      } else if (value <= this.getValue("high")) {
        return "high";
      } else if (value <= this.getValue("highest")) {
        return "highest";
      } else {
        return "default";
      }
    },

    outsideOfScope: function(value) {
      return (
        value < this.getValue("lowest") || value > this.getValue("highest")
      );
    },

    classByValue: function(value) {
      switch (this.getLevel(Math.round(value))) {
        case 1:
          return "level1-bg";

        case 2:
          return "level2-bg";

        case 3:
          return "level3-bg";

        case 4:
          return "level4-bg";

        default:
          return "grey-bg";
      }
    }
  };

  return new Heat();
};
