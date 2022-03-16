import sensors_ from "./sensors";
import { getParams } from "./params";

const buildQueryParamsForCrowdMapLayer_ = (gridSizeX, params, sensors) => ({
  call: (streamIds, bounds) => {
    if (!sensors.selected()) return false;
    if (!hasTruthyValues(bounds)) return false;
    const data = params().data;
    if (!data.timeFrom || !data.timeTo) return false;
    if (!data.heat) return false;
    if (!data.gridResolution) return false;

    return {
      west: bounds.west,
      east: bounds.east,
      south: bounds.south,
      north: bounds.north,
      time_from: data.timeFrom,
      time_to: data.timeTo,
      grid_size_x: gridSizeX(data.gridResolution),
      grid_size_y: data.gridResolution,
      tags: data.tags,
      usernames: data.usernames,
      sensor_name: sensors.selected().sensor_name,
      measurement_type: sensors.selected().measurement_type,
      unit_symbol: sensors.selected().unit_symbol,
      stream_ids: streamIds,
    };
  },
});

const hasTruthyValues = (obj) => Object.values(obj).every((x) => !!x);

const gridSizeX_ = (x) => {
  const width =
    window.innerWidth ||
    document.documentElement.clientWidth ||
    document.body.clientWidth;

  const height =
    window.innerHeight ||
    document.documentElement.clientHeight ||
    document.body.clientHeight;

  return (Math.round(x) * width) / height;
};

export const buildQueryParamsForCrowdMapLayer =
  buildQueryParamsForCrowdMapLayer_(gridSizeX_, getParams, sensors_);

export const buildQueryParamsForCrowdMapLayerTest = (
  gridSizeX,
  params,
  sensors
) => buildQueryParamsForCrowdMapLayer_(gridSizeX, params, sensors);
