import { Elm } from "../elm/src/Main.elm";
import logoNav from "../../assets/images/aircasting-logo-nav.svg";
import linkIcon from "../../assets/images/link-icon.svg";
import "nouislider";
import * as graph from "../angular/code/services/graph";

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
        gridResolution: 25,
        isIndoor: false,
        isStreaming: true,
        sensorId: "Particulate Matter-airbeam2-pm2.5 (µg/m³)"
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
        heatMapThresholdValues,
        isStreaming: data.isStreaming
      };

      console.warn(flags);

      window.__elmApp = Elm.Main.init({ flags });

      setupHeatMap();
    });
});

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
      node.noUiSlider.set(toMiddleValues(thresholds));
      const [min, max] = toExtremes(thresholds);
      node.noUiSlider.updateOptions({
        range: { min, max }
      });

      console.warn("heatmap updated", Object.values(toValues(node.noUiSlider)));

      // changing extremes could have changed middle values
      if (haveMiddleValuesChanged(node.noUiSlider, thresholds)) {
        window.__elmApp.ports.updateHeatMapThresholdsFromAngular.send(
          toValues(node.noUiSlider)
        );
      }
    });

    window.__elmApp.ports.drawFixed.subscribe(draw(graph.fetchAndDrawFixed));

    window.__elmApp.ports.drawMobile.subscribe(draw(graph.fetchAndDrawMobile));
  }
};

const draw = fnc => ({ times, streamId, heat, sensor }) =>
  fnc({ sensor, heat, times, streamId });

const toValues = noUiSlider => ({
  threshold1: noUiSlider.options.range.min,
  threshold2: noUiSlider.get()[0],
  threshold3: noUiSlider.get()[1],
  threshold4: noUiSlider.get()[2],
  threshold5: noUiSlider.options.range.max
});

const haveMiddleValuesChanged = (noUiSlider, thresholds) => {
  const [threshold2, threshold3, threshold4] = toMiddleValues(thresholds);
  return (
    threshold2 !== noUiSlider.get()[0] ||
    threshold3 !== noUiSlider.get()[1] ||
    threshold4 !== noUiSlider.get()[2]
  );
};

const toMiddleValues = ({ threshold2, threshold3, threshold4 }) => [
  threshold2,
  threshold3,
  threshold4
];

const toExtremes = ({ threshold1, threshold5 }) => [threshold1, threshold5];
