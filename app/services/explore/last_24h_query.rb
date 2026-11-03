module Explore
  # Each stream's lowest and highest reading over the last 24 hours, for the
  # station detail. Raw readings, not hourly averages: flattening a spike into
  # the hour around it would under-report the extreme the range exists to
  # show.
  #
  # One grouped aggregate for the whole station rather than one query per
  # stream. Both tables have the composite index the GROUP BY needs —
  # index_fixed_measurements_on_stream_id_and_time_with_time_zone and
  # index_station_measurements_on_station_stream_id_and_measured_at — so each
  # stream costs an index range over its own window: about 1440 rows for an
  # AirBeam at one reading a minute, about 24 for an hourly government feed.
  #
  # A stream missing from the result reported nothing in the window; its range
  # entry sends `last_24h: null`, which is the normal state of a dormant
  # station.
  class Last24hQuery
    WINDOW = 24.hours

    # => { stream_id => { min:, max: } }
    def airbeam(stream_ids)
      aggregate(
        stream_ids,
        FixedMeasurement
          .where(stream_id: stream_ids)
          .where('time_with_time_zone > ?', WINDOW.ago)
          .group(:stream_id),
        'stream_id',
      )
    end

    def government(station_stream_ids)
      aggregate(
        station_stream_ids,
        StationMeasurement
          .where(station_stream_id: station_stream_ids)
          .where('measured_at > ?', WINDOW.ago)
          .group(:station_stream_id),
        'station_stream_id',
      )
    end

    private

    def aggregate(ids, scope, key_column)
      return {} if ids.empty?

      scope
        .pluck(Arel.sql("#{key_column}, MIN(value), MAX(value)"))
        .to_h { |id, min, max| [id, { min: min, max: max }] }
    end
  end
end
