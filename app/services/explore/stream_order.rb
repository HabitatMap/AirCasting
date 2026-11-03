module Explore
  # The order the station detail lists its streams in: the catalogue's order for
  # the parameters it names, then everything else, each group by sensor name.
  #
  # The map sorts by Parameters::KEYS alone (Item.with_streams) because it only
  # ever holds catalogue streams. The detail carries every stream of a session, so
  # a parameter the catalogue does not name — a legacy sensor, or a government
  # pollutant not yet on the filter chips — must not raise on a nil index.
  #
  # The sensor-name tiebreak is what separates PM1, PM2.5 and PM10: all three
  # are 'Particulate Matter', so the catalogue cannot order them.
  module StreamOrder
    def self.call(streams)
      streams.sort_by do |stream|
        index = Parameters::KEYS.index(stream.parameter)

        [index ? 0 : 1, index || 0, stream.sensor_name.to_s]
      end
    end
  end
end
