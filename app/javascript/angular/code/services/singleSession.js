// The extremes are needed in Highcharts to make the zoom buttons behave correctly.
// For example let's say Highcharts is showing 24 hours of measurements for a stream
// that has 1 month of measurements. By setting one empty start point at the beginning
// of the month, Highcharts knows that the 1 week and 1 month button should be enabled.
// The same for the empty point at the end.
export const measurementsToTimeWithExtremes = ({ measurements, times }) => {
  const { start, end } = times;
  return {
    [start]: {
      x: start,
      y: null,
      latitude: null,
      longitude: null
    },
    ...measurementsToTime(measurements),
    [end]: {
      x: end,
      y: null,
      latitude: null,
      longitude: null
    }
  };
};

export const measurementsToTime = measurements =>
  measurements.reduce((acc, measurement) => {
    const x = moment(measurement.time, "YYYY-MM-DDTHH:mm:ss")
      .utcOffset(0, true)
      .valueOf();

    return {
      ...acc,
      [x]: {
        x,
        y: measurement.value,
        latitude: measurement.latitude,
        longitude: measurement.longitude
      }
    };
  }, {});
