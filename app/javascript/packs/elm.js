import $ from "jquery";
window.jQuery = window.$ = $;
import "jquery-ui/ui/widgets/autocomplete";
import "../jquery.ui.daterangepicker";
import "../../assets/stylesheets/vendor/jquery-ui-1.8.17.custom";
import { Elm } from "../elm/src/Main.elm";
import fitScaleIcon from "../../assets/images/icons/fit-scale-icon.svg";
import linkIcon from "../../assets/images/icons/link-icon.svg";
import resetIconBlack from "../../assets/images/icons/reset-icon-black.svg";
import resetIconWhite from "../../assets/images/icons/reset-icon-white.svg";
import themeSwitchIconBlue from "../../assets/images/icons/theme-switch-icon-blue.svg";
import themeSwitchIconDefault from "../../assets/images/icons/theme-switch-icon-default.svg";
import navLogo from "../../assets/images/aircasting-logo-nav";
import noUiSlider from "nouislider";
import * as graph from "../javascript/graph";
import tippy from "tippy.js";
import "tippy.js/dist/tippy.css";
import "../../assets/stylesheets/main.scss";
import "tippy.js/themes/light-border.css";
import { createObserver } from "../createObserver.js";
import "../../../node_modules/luminous-lightbox/dist/luminous-basic.css";
import "whatwg-fetch"; // fetch is missing in some browsers (eg IE11)
import { DEFAULT_THEME } from "../javascript/constants";
import { getParams, updateParam } from "../javascript/params";
import { get } from "../javascript/http";
import constants from "../javascript/constants";
import { init } from "../javascript/googleMapsInit";
window.initMap = init;
import sensors from "../javascript/sensors";

import pubsub from "../javascript/pubsub";
pubsub.subscribe("googleMapsReady", function () {
  require("../javascript/sessionsMap");
});

if (window.NodeList && !NodeList.prototype.forEach) {
  NodeList.prototype.forEach = Array.prototype.forEach;
}

if (!Object.values) {
  Object.values = (obj) => Object.keys(obj).map((key) => obj[key]);
}

createObserver({
  selector: ".js--toggle-nav",
  onMount: () => {
    const menuToggleButtons = document.querySelectorAll(".js--toggle-nav");
    Array.from(menuToggleButtons).map((button) => {
      button.addEventListener("click", () => {
        const header = document.querySelector(".header");
        header.classList.toggle("header--nav-expanded");
      });
    });
  },
});

document.addEventListener("DOMContentLoaded", () => {
  const session_type =
    window.location.pathname === constants.fixedMapRoute
      ? "FixedSession"
      : "MobileSession";

  // This request is cached in the browser so it should not delay the application too much.
  // The best way to handle this would be to have the application load the sensors at the
  // same time it is loading the ui.
  // That way the user would not see a blank page until the sensors are loaded.
  get("/api/sensors", { session_type: session_type }).then((sensors_) => {
    window.__sensors = sensors_;

    const defaultParams = {
      keepFiltersExpanded: false,
      scroll: 0,
      theme: DEFAULT_THEME,
    };

    const params = { ...defaultParams, ...getParams() };

    const defaultData = {
      location: "",
      tags: "",
      usernames: "",
      crowdMap: false,
      gridResolution: 31, // this translates to grid cell size: 20; formula: f(x) = 51 - x
      isIndoor: false,
      isActive: true,
      sensorId: sensors.defaultSensorId(),
      isSearchAsIMoveOn: false,
    };

    const data = { ...defaultData, ...params.data };

    const heatMapThresholdValues = data.heat
      ? {
          threshold1: data.heat.lowest,
          threshold2: data.heat.low,
          threshold3: data.heat.mid,
          threshold4: data.heat.high,
          threshold5: data.heat.highest,
        }
      : null;

    const flags = {
      sensors: window.__sensors,
      selectedSensorId: data.sensorId,
      location: data.location,
      isCrowdMapOn: data.crowdMap,
      crowdMapResolution: data.gridResolution,
      tags: data.tags.split(", ").filter((tag) => tag !== ""),
      profiles: data.usernames.split(", ").filter((tag) => tag !== ""),
      selectedStreamId: params.selectedStreamId || null,
      timeRange: {
        timeFrom: data.timeFrom,
        timeTo: data.timeTo,
      },
      isIndoor: data.isIndoor,
      fitScaleIcon,
      linkIcon,
      resetIconBlack,
      resetIconWhite,
      themeSwitchIconBlue,
      themeSwitchIconDefault,
      navLogo,
      heatMapThresholdValues,
      isActive: data.isActive,
      isSearchAsIMoveOn: data.isSearchAsIMoveOn,
      scrollPosition: params.scroll,
      theme: params.theme,
      keepFiltersExpanded: params.keepFiltersExpanded,
    };

    window.__elmApp = Elm.Main.init({ flags });

    setupHeatMap();
    setupTooltips();
  });
});

const baseOptionsForTooltips = {
  arrow: true,
  theme: "light-border",
};

const desktopOptionsForTooltips = {
  placement: "right",
};

const mobileOptionsForTooltips = {
  placement: "bottom",
};

const setupTooltips = () => {
  const nodes = document.querySelectorAll("[data-tippy-content]");
  if (nodes.length === 0) {
    setTimeout(setupTooltips, 100);
  } else if (window.innerWidth < 768) {
    tippy(nodes, { ...baseOptionsForTooltips, ...mobileOptionsForTooltips });
  } else {
    tippy(nodes, { ...baseOptionsForTooltips, ...desktopOptionsForTooltips });
  }
};

const setupHeatMap = () => {
  const node = document.getElementById("heatmap");
  if (!node) {
    setTimeout(setupHeatMap, 100);
  } else {
    noUiSlider.create(node, {
      start: [20, 40, 60],
      step: 1,
      range: {
        min: 0,
        max: 100,
      },
      tooltips: true,
      ariaFormat: {
        to: (x) => Math.round(x),
        from: Number,
      },
      format: {
        to: (x) => Math.round(x),
        from: Number,
      },
      connect: [true, true, true, true],
    });

    var connect = node.querySelectorAll(".noUi-connect");
    var classes = ["level1-bg", "level2-bg", "level3-bg", "level4-bg"];
    for (var i = 0; i < connect.length; i++) {
      connect[i].classList.add(classes[i]);
    }

    node.noUiSlider.on("end", ([threshold2, threshold3, threshold4]) => {
      window.__elmApp.ports.updateHeatMapThresholdsFromJavaScript.send(
        toValues(node.noUiSlider)
      );
    });

    window.__elmApp.ports.updateHeatMapThresholds.subscribe((thresholds) => {
      console.log("heatmap from elm", Object.values(thresholds));
      const [min, max] = toExtremes(thresholds);
      node.noUiSlider.updateOptions({
        range: { min, max },
      });
      node.noUiSlider.set(toMiddleValues(thresholds));

      console.log("heatmap updated", Object.values(toValues(node.noUiSlider)));

      // changing extremes could have changed middle values
      window.__elmApp.ports.updateHeatMapThresholdsFromJavaScript.send(
        toValues(node.noUiSlider)
      );
    });

    window.__elmApp.ports.drawFixed.subscribe(draw(graph.drawFixed));

    window.__elmApp.ports.drawMobile.subscribe(draw(graph.drawMobile));

    window.__elmApp.ports.updateGraphYAxis.subscribe((heat) => {
      graph.updateYAxis(heat);
    });
    window.__elmApp.ports.updateGraphData.subscribe((data) => {
      graph.updateGraphData(data);
    });

    window.__elmApp.ports.observeSessionsList.subscribe(() => {
      createObserver({
        selector: ".session-cards-container",
        onMount: () => {
          window.__elmApp.ports.setScroll.send(null);
        },
      });
    });

    window.__elmApp.ports.updateParams.subscribe((param) => {
      updateParam(param);
    });
  }
};

const draw =
  (fnc) =>
  ({ times, heat, sensor, measurements }) =>
    window.requestAnimationFrame(() =>
      fnc({
        sensor,
        heat,
        times,
        measurements,
      })
    );

const toValues = (noUiSlider) => ({
  threshold1: noUiSlider.options.range.min,
  threshold2: noUiSlider.get()[0],
  threshold3: noUiSlider.get()[1],
  threshold4: noUiSlider.get()[2],
  threshold5: noUiSlider.options.range.max,
});

const toMiddleValues = ({ threshold2, threshold3, threshold4 }) => [
  threshold2,
  threshold3,
  threshold4,
];

const toExtremes = ({ threshold1, threshold5 }) => [threshold1, threshold5];

const setupHorizontalWheelScroll = (node) => {
  const callback = (event) => {
    // The "wheel" event is triggered by both a mouse wheel and a trackpad.
    // Only when `deltaX` is 0 the scroll is coming from a mouse wheel (or from trackpad that is scrolled perfectly on the vertical axis).
    // If the trackpad is scrolled vertically or at an angle then deltaY !== 0.
    if (Math.abs(event.deltaX) !== 0) return;
    event.preventDefault();
    const scrollBy = Math.sign(event.deltaY) * 100;
    node.scroll(node.scrollLeft + scrollBy, 0);
  };

  node.addEventListener("wheel", callback);
};

createObserver({
  selector: ".session-cards-container",
  onMount: setupHorizontalWheelScroll,
});
