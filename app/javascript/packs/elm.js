import { Elm } from "../elm/src/Main.elm";
import logoNav from "../../assets/images/aircasting-logo-nav.svg";
import linkIcon from "../../assets/images/link-icon.svg";
import resetIconBlack from "../../assets/images/reset-icon-black.svg";
import resetIconWhite from "../../assets/images/reset-icon-white.svg";
import tooltipIcon from "../../assets/images/tooltip-icon.svg";
import "nouislider";
import * as graph from "../javascript/graph";
import tippy from "tippy.js";
import "../../assets/stylesheets/main.scss";
import "tippy.js/themes/light-border.css";
import { createObserver } from "../createObserver.js";
import "../../assets/stylesheets/vendor/jquery-ui-1.8.17.custom.css";
import "../../assets/stylesheets/vendor/jquery.autocomplete.css";
import "../../assets/stylesheets/vendor/jquery.lightbox-0.5.css";
import "whatwg-fetch"; // fetch is missing in some browsers (eg IE11)

if (window.NodeList && !NodeList.prototype.forEach) {
  NodeList.prototype.forEach = Array.prototype.forEach;
}

if (!Object.values) {
  Object.values = obj => Object.keys(obj).map(key => obj[key]);
}

document.addEventListener("DOMContentLoaded", () => {
  fetch("/api/sensors.json")
    .then(x => x.json())
    .then(sensors => {
      window.__sensors = sensors;

      const params = window.location.hash
        .slice(2)
        .split("&")
        .filter(x => x.length !== 0)
        .map(x => x.split("="))
        .map(([k, v]) => [k, decodeURIComponent(v)])
        .map(([k, v]) => [k, JSON.parse(v)])
        .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {});

      const defaultData = {
        location: "",
        tags: "",
        usernames: "",
        crowdMap: false,
        gridResolution: 31, // this translates to grid cell size: 20; formula: f(x) = 51 - x
        isIndoor: false,
        isStreaming: true,
        sensorId: "Particulate Matter-airbeam2-pm2.5 (µg/m³)",
        isSearchAsIMoveOn: false
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
        logoNav,
        linkIcon,
        resetIconBlack,
        resetIconWhite,
        tooltipIcon,
        heatMapThresholdValues,
        isStreaming: data.isStreaming,
        isSearchAsIMoveOn: data.isSearchAsIMoveOn
      };

      console.warn(flags);

      window.__elmApp = Elm.Main.init({ flags });

      setupHeatMap();

      setupTooltips();
    });
});

const setupTooltips = () => {
  const nodes = document.querySelectorAll("[data-tippy-content]");
  if (nodes.length === 0) {
    setTimeout(setupTooltips, 100);
  } else {
    tippy(nodes, {
      placement: "right",
      arrow: true,
      theme: "light-border"
    });
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
    var classes = ["green-bg", "yellow-bg", "orange-bg", "red-bg"];
    for (var i = 0; i < connect.length; i++) {
      connect[i].classList.add(classes[i]);
    }

    node.noUiSlider.on("end", ([threshold2, threshold3, threshold4]) => {
      window.__elmApp.ports.updateHeatMapThresholdsFromAngular.send(
        toValues(node.noUiSlider)
      );
    });

    window.__elmApp.ports.updateHeatMapThresholds.subscribe(thresholds => {
      console.warn("heatmap from elm", Object.values(thresholds));
      const [min, max] = toExtremes(thresholds);
      node.noUiSlider.updateOptions({
        range: { min, max }
      });
      node.noUiSlider.set(toMiddleValues(thresholds));

      console.warn("heatmap updated", Object.values(toValues(node.noUiSlider)));

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
  selector: ".sessions-container",
  onMount: setupHorizontalWheelScroll
});
