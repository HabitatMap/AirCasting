export const buildQueryParamsForAverages = (
  map,
  sensors,
  params,
  utils,
  flash
) => ({
  call: (sessionIds) => {
    if (!sensors.selected()) {
      flash.set('You need to select parameter / sensor');
      return false;
    }
    const bounds = map.getBounds();
    if (!hasTruthyValues(bounds)) return false;
    const data = params.get('data');
    if (!data.time) return false;
    if (!data.heat) return false;
    if (!data.gridResolution) return false;

    return {
      west: bounds.west,
      east: bounds.east,
      south: bounds.south,
      north: bounds.north,
      time_from: utils.normalizeTime(data.time.timeFrom),
      time_to: utils.normalizeTime(data.time.timeTo),
      day_from: data.time.dayFrom,
      day_to: data.time.dayTo,
      year_from: data.time.yearFrom,
      year_to: data.time.yearTo,
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

const hasTruthyValues = obj => Object.values(obj).every(x => !!x)
