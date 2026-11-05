FactoryBot.define do
  factory :fixed_measurement do
    stream
    value { rand(1..100) }
    time { Time.current }
    # Derived, not independent, and not simply equal: `time` holds the session's
    # local wall clock in a naive column, `time_with_time_zone` the real instant
    # it names. The two coincide only for a UTC session. This is the same
    # conversion the ingester applies (FixedSessions::BinaryProtocol::Ingester
    # #build_records) and the same one the legacy backfill used in SQL as
    # `time AT TIME ZONE '<zone>'`, so a spec cannot pass on a pair of values
    # that could not exist together in the table.
    # Specs pass `time:` as a Time or as a String; Time.zone.parse is how
    # ActiveRecord would read the String anyway, so both land on the same naive
    # value the column will hold. `+ subsec` because Utils.from_local_as_utc
    # rebuilds the instant from whole-second components — without it every row
    # created in the same second collides on the unique
    # (stream_id, time_with_time_zone) index.
    time_with_time_zone do
      naive = time.is_a?(String) ? Time.zone.parse(time) : time
      Utils.from_local_as_utc(naive, stream.session.time_zone) + naive.subsec
    end
  end
end
