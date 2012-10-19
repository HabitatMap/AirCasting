require_dependency 'aircasting/username_param'

class AverageInfo
  Y_SIZES = (1..300).map { |i| 1.2 ** i * 0.000001 }

  attr_reader :data

  def initialize(data)
    @data = data
  end

  def as_json(options=nil)
    if data[:west] < data[:east]
      grid_x = (data[:east] - data[:west]) / data[:grid_size_x]
    else
      grid_x = (180 - data[:west] + 180 + data[:east]) / data[:grid_size_x]
    end

    grid_y = (data[:north] - data[:south]) / data[:grid_size_y]
    grid_y = Y_SIZES.find { |x| x > grid_y }

    usernames = AirCasting::UsernameParam.split(data[:usernames])

    streams = Stream.
      only_contributed.
      with_measurement_type(data[:measurement_type]).
      with_sensor(data[:sensor_name]).
      in_rectangle(data).
      with_usernames(usernames)

    stream_ids = streams.map(&:id)
    tags = data[:tags].to_s.split(/[\s,]/)

    measurements = Measurement.
      select(
        "AVG(value) AS avg, " +
          "round(CAST(longitude AS DECIMAL(36, 12)) / CAST(#{grid_x} AS DECIMAL(36,12)), 0) AS middle_x, " +
          "round(CAST(latitude AS DECIMAL(36, 12)) / CAST(#{grid_y} AS DECIMAL(36,12)), 0) AS middle_y "
      ).
        with_streams(stream_ids).
        group("middle_x").
        group("middle_y").
        in_rectangle(data).
        with_time(data).
        with_tags(tags)

    measurements.map do |measurement|
      {
        :value => measurement.avg.to_f,
        :west  =>  measurement.middle_x.to_f * grid_x - grid_x / 2,
        :east  =>  measurement.middle_x.to_f * grid_x + grid_x / 2,
        :south  =>  measurement.middle_y.to_f * grid_y - grid_y / 2,
        :north  =>  measurement.middle_y.to_f * grid_y + grid_y / 2
      }
    end
  end
end
