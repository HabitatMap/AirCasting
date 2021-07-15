import test from "blue-tape";
import { clusterer, distanceBetweenInPixels } from "../clusterer";

test("return array of objects that should be clustered", (t) => {
  const object1 = "obj1";
  const object2 = "obj2";
  const object3 = "obj3";
  const objectsToCluster = [
    { latLng: { lat: () => 1, lng: () => 1 }, object: object1 },
    { latLng: { lat: () => 50, lng: () => 50 }, object: object2 },
    { latLng: { lat: () => 2, lng: () => 2 }, object: object3 },
  ];

  const map = {
    fromLatLngToPoint: (latLng) => ({ x: latLng.lat(), y: latLng.lng() }),
    getZoom: () => 1,
  };

  const actual = clusterer(objectsToCluster, map);

  const expected = [object1, object3];
  t.deepEqual(actual, expected);

  t.end();
});

test("distanceBetweenInPixels calculatets the correct distance", (t) => {
  const latLng1 = {
    lat: () => 142.16963925333334,
    lng: () => 86.75634952273033,
  };
  const latLng2 = {
    lat: () => 142.16964181333333,
    lng: () => 86.75637267239966,
  };
  const fromLatLngToPoint = (latLng) => ({ x: latLng.lat(), y: latLng.lng() });
  const zoom = 21;

  const actual = distanceBetweenInPixels(
    latLng1,
    latLng2,
    fromLatLngToPoint,
    zoom
  );
  const expected = 48.84432193464082;

  t.deepEqual(actual, expected);

  t.end();
});
