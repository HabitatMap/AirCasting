import test from "blue-tape";
import { calculateBounds } from "../calculateBounds";

test("returns the correct bounds", (t) => {
  const session = {
    stream: {
      min_latitude: 1,
      max_latitude: 3,
      min_longitude: 1,
      max_longitude: 3,
    },
  };

  const actual = calculateBounds(session);

  const expected = { north: 3, east: 3, south: 1, west: 1 };
  t.deepEqual(actual, expected);

  t.end();
});

test("if the session has no stream returns infinities", (t) => {
  const session = {};
  const actual = calculateBounds(session);

  const expected = {
    north: -Infinity,
    east: -Infinity,
    south: Infinity,
    west: Infinity,
  };
  t.deepEqual(actual, expected);

  t.end();
});
