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

    streams = Stream.
      joins(:session).
      where('sessions.contribute' => true).
      where(:sensor_name => data[:sensor_name]).
      where(:measurement_type => data[:measurement_type]).
      in_rectangle(data).
      all

    stream_ids = streams.map(&:id)

    measurements = Measurement.
      select(
        "AVG(value) AS avg, " +
          "round(CAST(longitude AS DECIMAL(36, 12)) / CAST(#{grid_x} AS DECIMAL(36,12)), 0) AS middle_x, " +
          "round(CAST(latitude AS DECIMAL(36, 12)) / CAST(#{grid_y} AS DECIMAL(36,12)), 0) AS middle_y "
      ).
        where(:stream_id => stream_ids).
        group("middle_x").
        group("middle_y").
        longitude_range(data[:west], data[:east]).
        latitude_range(data[:south], data[:north]).
        time_range(data[:time_from], data[:time_to]).
        day_range(data[:day_from], data[:day_to])

    if data[:year_to] && data[:year_from]
      measurements = measurements.year_range(
        Date.new(data[:year_from]),
        Date.new(data[:year_to].to_i + 1) - 1
      )
    end

    tags = data[:tags].to_s.split(/[\s,]/)
    if tags.present?
      sessions_ids = Session.select("sessions.id").tagged_with(tags).map(&:id)
      if sessions_ids.present?
        measurements = measurements.where(:streams => {:session_id => sessions_ids.compact.uniq})
      else
        measurements = []
      end
    end

    usernames = data[:usernames].to_s.split(/[\s,]/)
    if usernames.present?
      measurements = measurements.joins(:session => :user).where(:users => {:username =>  usernames})
    end

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
