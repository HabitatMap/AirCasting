class FixedAverageInfo
  Y_SIZES = (1..300).map { |i| 1.2 ** i * 0.000001 }

  attr_reader :data

  def initialize(data)
    @data = data
  end

  def as_json(options=nil)
    averages
  end

  private

  def averages
    Session
    .select(
      "id, " +
      "ROUND(longitude / #{grid_x}, 0) AS middle_x, " +
      "ROUND(latitude / #{grid_y}, 0) AS middle_y "
    )
    .find(data[:session_ids])
    .group_by { |s| [s[:middle_x], s[:middle_y]] }
    .map do |middle_xy, sessions|
      {
        :value => calculate_average(sessions).to_f,
        :west  =>  middle_xy.first.to_f * grid_x - grid_x / 2,
        :east  =>  middle_xy.first.to_f * grid_x + grid_x / 2,
        :south  =>  middle_xy.last.to_f * grid_y - grid_y / 2,
        :north  =>  middle_xy.last.to_f * grid_y + grid_y / 2
      }
    end
  end

  def calculate_average(sessions)
    sessions
    .map { |session| last_hour_average_for(session, data[:sensor_name]) }
    .sum / sessions.size
  end

  def last_hour_average_for(session, sensor_name)
    stream = Stream.where(sensor_name: sensor_name, session_id: session.id).first

    last_measurement_time = stream.measurements.last.time
    measurements = stream.measurements.where(time: (last_measurement_time - 1.hour)..last_measurement_time)
    measurements.average(:value)
  end

  def grid_x
    @grid_x ||= if data[:west] < data[:east]
       (data[:east] - data[:west]) / data[:grid_size_x]
    else
      @grid_x = (180 - data[:west] + 180 + data[:east]) / data[:grid_size_x]
    end
  end

  def grid_y
    @grid_y ||= Y_SIZES.find { |x| x > (data[:north] - data[:south]) / data[:grid_size_y] }
  end
end
