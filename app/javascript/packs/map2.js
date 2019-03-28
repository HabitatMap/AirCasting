import { Elm } from '../elm/src/Yellow.elm';

let map;

window.initMap = () => {
  const node = document.getElementById('map1');
  if (!node) return setTimeout(window.initMap, 100);

  map = new google.maps.Map(node, {
    center: {lat: -34.397, lng: 150.644},
    zoom: 8
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const app = Elm.Yellow.init();
})
