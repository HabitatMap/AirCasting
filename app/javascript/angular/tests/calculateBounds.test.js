import test from "blue-tape";
import { calculateBounds_ } from "../code/calculateBounds";

test("with no selected sensors it returns null", t => {
  const sensors = { anySelected: () => null };

  const actual = calculateBounds_()(sensors);

  const expected = undefined;
  t.deepEqual(actual, expected);

  t.end();
});

test("returns the correct bounds", t => {
  const sensorName = "sensor name";
  const sensors = { anySelected: () => ({ sensor_name: sensorName }) };
  const sessions = [
    {
      streams: {
        [sensorName]: {
          min_latitude: 1,
          max_latitude: 1,
          min_longitude: 1,
          max_longitude: 1
        }
      }
    },
    {
      streams: {
        [sensorName]: {
          min_latitude: 3,
          max_latitude: 3,
          min_longitude: 3,
          max_longitude: 3
        }
      }
    }
  ];
  const zoom = 1;
  const pixelsToLength = () => 0;

  const actual = calculateBounds_(pixelsToLength)(sensors, sessions, zoom);

  const expected = { north: 3, east: 3, south: 1, west: 1 };
  t.deepEqual(actual, expected);

  t.end();
});

test("it skips streams with different name than the selected sensor", t => {
  const sensorName = "sensor name";
  const sensors = { anySelected: () => ({ sensor_name: sensorName }) };
  const sessions = [
    {
      streams: {
        otherStream: {
          min_latitude: 1,
          max_latitude: 1,
          min_longitude: 1,
          max_longitude: 1
        }
      }
    }
  ];
  const zoom = 1;
  const pixelsToLength = () => 0;

  const actual = calculateBounds_(pixelsToLength)(sensors, sessions, zoom);

  const expected = {
    north: -Infinity,
    east: -Infinity,
    south: Infinity,
    west: Infinity
  };
  t.deepEqual(actual, expected);

  t.end();
});
