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
  window.__SessionsList = Elm.Yellow.init();
})


fetch('/api/sensors.json').then(x => x.json()).then(x => { window.__sensors = x })
