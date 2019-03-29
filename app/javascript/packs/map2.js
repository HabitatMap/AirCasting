import { Elm } from '../elm/src/Yellow.elm';

window.initMap = () => {
  const node = document.getElementById('map1');

  if (!node) return setTimeout(window.initMap, 100);

  window.__map = new google.maps.Map(node, {
    center: {lat: -34.397, lng: 150.644},
    zoom: 8
  });

	console.warn(window.__map)
}

document.addEventListener('DOMContentLoaded', () => {
  const flags = {
    isCrowdMapOn: false, //$scope.params.get('data').crowdMap || false,
    crowdMapResolution: 25, //$scope.params.get('data').gridResolution || 25,
    tags: [], //$scope.params.get('data').tags.split(', ').filter((tag) => tag !== "") || [],
    profiles: [], //$scope.params.get('data').usernames.split(', ').filter((tag) => tag !== "") || [],
    timeRange: {
      timeFrom: 0,
      timeTo: 0
    }
  }
  window.__SessionsList = Elm.Yellow.init({ flags });
})


fetch('/api/sensors.json').then(x => x.json()).then(x => { window.__sensors = x })
