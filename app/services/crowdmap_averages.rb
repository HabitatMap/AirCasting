require_dependency 'aircasting/username_param'

module CrowdmapAverages
  class AveragesBase
    Y_SIZES = (1..300).map { |i| 1.2**i * 0.000001 }

    attr_reader :data

    def initialize(data)
      @data = data
    end

    private

    def averages_from_measurements(selected_measurements)
      selected_measurements.map do |measurement|
        {
          value: measurement.avg.to_f,
          west: measurement.middle_x.to_f * grid_x - grid_x / 2,
          east: measurement.middle_x.to_f * grid_x + grid_x / 2,
          south: measurement.middle_y.to_f * grid_y - grid_y / 2,
          north: measurement.middle_y.to_f * grid_y + grid_y / 2
        }
      end
    end

    def measurements_in_viewport
      Measurement
        .unscoped
        .select(
          'AVG(value) AS avg, ' +
            "ROUND(measurements.longitude / #{grid_x}, 0) AS middle_x, " +
            "ROUND(measurements.latitude / #{grid_y}, 0) AS middle_y "
        )
        .joins(:stream)
        .merge(streams)
        .group('middle_x')
        .group('middle_y')
        .in_rectangle(data)
    end

    def streams
      Stream
        .mobile
        .only_contributed
        .with_measurement_type(data[:measurement_type])
        .with_sensor(data[:sensor_name])
        .with_unit_symbol(data[:unit_symbol])
        .in_rectangle(data)
        .with_usernames(usernames)
        .with_tags(tags)
    end

    def usernames
      AirCasting::UsernameParam.split(data[:usernames])
    end

    def grid_x
      @grid_x ||=
        if data[:west] < data[:east]
          (data[:east] - data[:west]) / data[:grid_size_x]
        else
          @grid_x = (180 - data[:west] + 180 + data[:east]) / data[:grid_size_x]
        end
    end

    def grid_y
      @grid_y ||=
        Y_SIZES.find do |x|
          x > (data[:north] - data[:south]) / data[:grid_size_y]
        end
    end

    def tags
      data[:tags].to_s.split(/[\s,]/)
    end
  end

  class ForWeb < AveragesBase
    def as_json(options = nil)
      web_averages
    end

    private

    def web_averages
      averages_from_measurements(measurements_from_streams)
    end

    def measurements_from_streams
      measurements_in_viewport.with_time(data)
    end

    def streams
      Stream.where(id: data[:stream_ids])
    end
  end

  class ForMobile < AveragesBase
    def as_json(options = nil)
      mobile_averages
    end

    private

    def mobile_averages
      averages_from_measurements(measurements_from_period)
    end

    def measurements_from_period
      measurements_in_viewport.with_time2(data)
    end
  end
end
