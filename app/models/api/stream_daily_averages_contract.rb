module Api
  # Shared by `/api/v3/fixed_stream_daily_averages` (legacy `streams.id`) and
  # `/api/v3/station_stream_daily_averages` (`station_streams.id`). Same three
  # parameters, same meaning; only the table the id points at differs, which is
  # why the station endpoint's parameter is also called `stream_id`.
  #
  # Both dates were previously interpolated straight into `date >= ? AND
  # date <= ?`, so a missing one silently matched nothing and answered `200 []`,
  # and a malformed one reached PostgreSQL and 500'd.
  class StreamDailyAveragesContract < Dry::Validation::Contract
    params do
      required(:stream_id).filled(:integer)
      required(:start_date).filled(:date)
      required(:end_date).filled(:date)
    end

    # A single-day range is legitimate — the calendar asks for one day when the
    # session is one day long — so the two may be equal.
    rule(:end_date, :start_date) do
      next if values[:end_date] >= values[:start_date]

      key(:end_date).failure(
        text: 'must be greater than or equal to start_date',
        code: 'greater_than_or_equal_to',
        params: { other: 'start_date' },
      )
    end
  end
end
