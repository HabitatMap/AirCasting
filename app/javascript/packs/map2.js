import { Elm } from '../elm/src/Yellow.elm';

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
    const defaultData = { tags: "", usernames: "", crowdMap: false, gridResolution: 25 };
    const data = { ...defaultData, ...params.data };

    console.warn(data);

    const flags = {
      isCrowdMapOn: data.crowdMap || false,
      crowdMapResolution: data.gridResolution || 25,
      tags: data.tags.split(', ').filter((tag) => tag !== "") || [],
      profiles: data.usernames.split(', ').filter((tag) => tag !== "") || [],
      timeRange: {
        timeFrom: data.timeFrom,
        timeTo: data.timeTo
      }
    };

    console.warn(flags);

    window.__SessionsList = Elm.Yellow.init({ flags });
  });
});
