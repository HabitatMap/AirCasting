import sensors_ from "../../../javascript/sensors";

const buildQueryParamsForCrowdMapLayer_ = sensors => (params, utils) => ({
  call: (sessionIds, bounds) => {
    if (!sensors.selected()) return false;
    if (!hasTruthyValues(bounds)) return false;
    const data = params.get("data");
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
      grid_size_x: utils.gridSizeX(data.gridResolution),
      grid_size_y: data.gridResolution,
      tags: data.tags,
      usernames: data.usernames,
      sensor_name: sensors.selected().sensor_name,
      measurement_type: sensors.selected().measurement_type,
      unit_symbol: sensors.selected().unit_symbol,
      session_ids: sessionIds
    };
  }
});

const hasTruthyValues = obj => Object.values(obj).every(x => !!x);

export const buildQueryParamsForCrowdMapLayer = buildQueryParamsForCrowdMapLayer_(
  sensors_
);

export const buildQueryParamsForCrowdMapLayerTest = sensors =>
  buildQueryParamsForCrowdMapLayer_(sensors);
