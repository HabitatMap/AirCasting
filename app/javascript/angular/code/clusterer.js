export const clusterer = (objects, map, distanceThreshold = 22) => objects.reduce(reducer(objects, map, distanceThreshold), []);

const reducer = (objs, map, distanceThreshold) => (acc, obj) =>
  isClose(obj, objs, map, distanceThreshold) ? [...acc, obj.object] : acc

const isClose = (obj, objs, map, distanceThreshold) =>
  objs.filter(isNot(obj)).some(otherObj => objectsTooClose(obj, otherObj, map, distanceThreshold))

const objectsTooClose = (obj, otherObj, map, distanceThreshold) => {
  const distance = distanceBetweenInPixels(obj.latLng, otherObj.latLng, (latLng) => map.fromLatLngToPoint(latLng), map.getZoom());
  return (distance < distanceThreshold);
};

export const distanceBetweenInPixels = (latLng1, latLng2, fromLatLngToPoint, zoom) => {
  const point1 = fromLatLngToPoint(latLng1);
  const point2 = fromLatLngToPoint(latLng2);

  return toPixels(distance(point1, point2), zoom);
};

const distance = (point1, point2) =>
  Math.sqrt((point1.x-point2.x)**2 + (point1.y-point2.y)**2);

const toPixels = (length, zoom) => {
    const pixelSize = Math.pow(2, -zoom);
    return length/pixelSize;
};

const isNot = x => y => x !== y;
