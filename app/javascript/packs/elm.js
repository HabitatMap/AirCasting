import { Elm } from '../elm/src/Main.elm';
import logoNav from '../../assets/images/aircasting-logo-nav.svg';
import linkIcon from '../../assets/images/link-icon.svg';
import 'nouislider';

document.addEventListener('DOMContentLoaded', () => {
  fetch('/api/sensors.json').then(x => x.json()).then(sensors => {
    window.__sensors = sensors;
    const params = window.location.hash
      .slice(2)
      .split('&')
      .filter(x => x.length !== 0)
      .map(x => x.split('='))
      .map(([k, v]) => [k, decodeURIComponent(v)])
      .map(([k, v]) => [k, JSON.parse(v)])
      .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {});
    const defaultData = { location: "", tags: "", usernames: "", crowdMap: false, gridResolution: 25, isIndoor: false, sensorId: "Particulate Matter-airbeam2-pm2.5 (µg/m³)" };
    const data = { ...defaultData, ...params.data };

    console.warn(params);
    console.warn(data);

    const flags = {
      sensors: window.__sensors,
      selectedSensorId: data.sensorId,
      location: data.location,
      isCrowdMapOn: data.crowdMap,
      crowdMapResolution: data.gridResolution,
      tags: data.tags.split(', ').filter((tag) => tag !== ""),
      profiles: data.usernames.split(', ').filter((tag) => tag !== ""),
      selectedSessionId: params.selectedSessionIds ? params.selectedSessionIds[0] ? params.selectedSessionIds[0] : null : null,
      timeRange: {
        timeFrom: data.timeFrom,
        timeTo: data.timeTo
      },
      isIndoor: data.isIndoor,
      logoNav,
      linkIcon,
    };

    console.warn(flags);

    window.__elmApp = Elm.Main.init({ flags });

    setupHeatMap();
  });
});

const setupHeatMap = () => {
  const node = document.getElementById("heatmap");
  if (node) {
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
      connect: [ true, true, true, true ]
    });

    var connect = node.querySelectorAll(".noUi-connect");
    var classes = [ "green-bg", "yellow-bg", "orange-bg", "red-bg" ];
    for (var i = 0; i < connect.length; i++) {
      connect[i].classList.add(classes[i]);
    }

    window.__elmApp.ports.updateHeatMapThresholds.subscribe(({ h1, h2, h3, h4, h5 }) => {
      console.warn('heatmap from elm', [h1, h2, h3, h4, h5]);
      node.noUiSlider.updateOptions({
        range: { min: h1, max: h5 }
      });
      node.noUiSlider.set([h2, h3, h4]);
      console.warn('heatmap updated', node.noUiSlider.get());
    });
  }
};
