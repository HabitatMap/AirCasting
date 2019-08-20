import { Elm } from "../elm/src/Main.elm";
import navLogo from "../../assets/images/aircasting-logo-nav.svg";
import fitScaleIcon from "../../assets/images/fit-scale-icon.svg";
import linkIcon from "../../assets/images/link-icon.svg";
import filterIcon from "../../assets/images/filter-icon.svg";
import menuIcon from "../../assets/images/menu-icon.svg";
import resetIconBlack from "../../assets/images/reset-icon-black.svg";
import resetIconWhite from "../../assets/images/reset-icon-white.svg";
import themeSwitchIconBlue from "../../assets/images/theme-switch-icon-blue.svg";
import themeSwitchIconDefault from "../../assets/images/theme-switch-icon-default.svg";
import tooltipIcon from "../../assets/images/tooltip-icon.svg";
import "nouislider";
import * as graph from "../javascript/graph";
import tippy from "tippy.js";
import "../../assets/stylesheets/main.scss";
import "tippy.js/themes/light-border.css";
import { createObserver } from "../createObserver.js";
import "../../assets/stylesheets/vendor/jquery-ui-1.8.17.custom.css";
import "../../assets/stylesheets/vendor/jquery.autocomplete.css";
import "../../../node_modules/luminous-lightbox/dist/luminous-basic.css";
import "whatwg-fetch"; // fetch is missing in some browsers (eg IE11)
import { DEFAULT_THEME } from "../javascript/constants";
import { getParams } from "../javascript/params";

if (window.NodeList && !NodeList.prototype.forEach) {
  NodeList.prototype.forEach = Array.prototype.forEach;
}

if (!Object.values) {
  Object.values = obj => Object.keys(obj).map(key => obj[key]);
}

document.addEventListener("DOMContentLoaded", () => {
  // This request is cached in the browser so it should not delay the application too much.
  // The best way to handle this would be to have the application load the sensors at the
  // same time it is loading the ui.
  // That way the user would not see a blank page until the sensors are loaded.
  fetch("/api/sensors.json")
    .then(x => x.json())
    .then(sensors => {
      window.__sensors = sensors;

      const defaultParams = {
        areFiltersExpanded: false,
        scroll: 0,
        theme: DEFAULT_THEME,
      }
      
      const params = {  ...defaultParams, ...getParams() };

      const defaultData = {
        location: "",
        tags: "",
        usernames: "",
        crowdMap: false,
        gridResolution: 31, // this translates to grid cell size: 20; formula: f(x) = 51 - x
        isIndoor: false,
        isActive: true,
        sensorId: "Particulate Matter-airbeam2-pm2.5 (µg/m³)",
        isSearchAsIMoveOn: false,
      };

      const data = { ...defaultData, ...params.data };

      console.warn(params);
      console.warn(data);

      const heatMapThresholdValues = data.heat
        ? {
            threshold1: data.heat.lowest,
            threshold2: data.heat.low,
            threshold3: data.heat.mid,
            threshold4: data.heat.high,
            threshold5: data.heat.highest
          }
        : null;

      const flags = {
        sensors: window.__sensors,
        selectedSensorId: data.sensorId,
        location: data.location,
        isCrowdMapOn: data.crowdMap,
        crowdMapResolution: data.gridResolution,
        tags: data.tags.split(", ").filter(tag => tag !== ""),
        profiles: data.usernames.split(", ").filter(tag => tag !== ""),
        selectedSessionId: params.selectedSessionIds
          ? params.selectedSessionIds[0]
            ? params.selectedSessionIds[0]
            : null
          : null,
        timeRange: {
          timeFrom: data.timeFrom,
          timeTo: data.timeTo
        },
        isIndoor: data.isIndoor,
        navLogo,
        filterIcon,
        fitScaleIcon,
        linkIcon,
        menuIcon,
        resetIconBlack,
        resetIconWhite,
        themeSwitchIconBlue,
        themeSwitchIconDefault,
        tooltipIcon,
        heatMapThresholdValues,
        isActive: data.isActive,
        isSearchAsIMoveOn: data.isSearchAsIMoveOn,
        scrollPosition: params.scroll,
        theme: params.theme,
        areFiltersExpanded: params.areFiltersExpanded
      };

      console.warn(flags);

      window.__elmApp = Elm.Main.init({ flags });

      setupHeatMap();

      setupTooltips();
    });
});

const baseOptionsForTooltips = {
  arrow: true,
  theme: "light-border"
};

const desktopOptionsForTooltips = {
  placement: "right"
};

const mobileOptionsForTooltips = {
  placement: "bottom"
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
        max: 100
      },
      tooltips: true,
      ariaFormat: {
        to: x => Math.round(x),
        from: Number
      },
      format: {
        to: x => Math.round(x),
        from: Number
      },
      connect: [true, true, true, true]
    });

    var connect = node.querySelectorAll(".noUi-connect");
    var classes = ["level1-bg", "level2-bg", "level3-bg", "level4-bg"];
    for (var i = 0; i < connect.length; i++) {
      connect[i].classList.add(classes[i]);
    }

    node.noUiSlider.on("end", ([threshold2, threshold3, threshold4]) => {
      window.__elmApp.ports.updateHeatMapThresholdsFromAngular.send(
        toValues(node.noUiSlider)
      );
    });

    window.__elmApp.ports.updateHeatMapThresholds.subscribe(thresholds => {
      console.log("heatmap from elm", Object.values(thresholds));
      const [min, max] = toExtremes(thresholds);
      node.noUiSlider.updateOptions({
        range: { min, max }
      });
      node.noUiSlider.set(toMiddleValues(thresholds));

      console.log("heatmap updated", Object.values(toValues(node.noUiSlider)));

      // changing extremes could have changed middle values
      window.__elmApp.ports.updateHeatMapThresholdsFromAngular.send(
        toValues(node.noUiSlider)
      );
    });

    const callback = window.__elmApp.ports.graphRangeSelected.send;

    window.__elmApp.ports.drawFixed.subscribe(
      draw(graph.fetchAndDrawFixed(callback))
    );

    window.__elmApp.ports.drawMobile.subscribe(
      draw(graph.fetchAndDrawMobile(callback))
    );

    window.__elmApp.ports.updateGraphYAxis.subscribe(heat => {
      graph.updateYAxis(heat);
    });

    window.__elmApp.ports.observeSessionsList.subscribe(() => {
      createObserver({
        selector: ".session-cards-container",
        onMount: () => {
          window.__elmApp.ports.setScroll.send(null);
        }
      });
    });
  }
};

const draw = fnc => ({ times, streamIds, heat, sensor }) =>
  window.requestAnimationFrame(() => fnc({ sensor, heat, times, streamIds }));

const toValues = noUiSlider => ({
  threshold1: noUiSlider.options.range.min,
  threshold2: noUiSlider.get()[0],
  threshold3: noUiSlider.get()[1],
  threshold4: noUiSlider.get()[2],
  threshold5: noUiSlider.options.range.max
});

const toMiddleValues = ({ threshold2, threshold3, threshold4 }) => [
  threshold2,
  threshold3,
  threshold4
];

const toExtremes = ({ threshold1, threshold5 }) => [threshold1, threshold5];

const setupHorizontalWheelScroll = node => {
  const callback = event => {
    // The "wheel" event is triggered by both a mouse wheel and a trackpad.
    // Only when `deltaX` is 0 the scroll is assured to be coming from a trackpad.
    if (Math.abs(event.deltaX) !== 0) return;
    const scrollBy = Math.sign(event.deltaY) * 180;
    node.scroll(node.scrollLeft + scrollBy, 0);
  };

  node.addEventListener("wheel", callback);
};

createObserver({
  selector: ".session-cards-container",
  onMount: setupHorizontalWheelScroll
});
