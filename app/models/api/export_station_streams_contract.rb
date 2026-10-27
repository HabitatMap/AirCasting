module Api
  class ExportStationStreamsContract < Dry::Validation::Contract
    params do
      required(:email).filled(:string)
      required(:station_stream_ids).array(:integer)
    end

    rule(:station_stream_ids) do
      ids = values[:station_stream_ids]
      next if ids.size <= Api::ExportLimits::STATION_STREAM_IDS_MAX

      key.failure(
        text: "cannot export more than #{Api::ExportLimits::STATION_STREAM_IDS_MAX} station streams at once",
        code: 'too_many',
        params: { max: Api::ExportLimits::STATION_STREAM_IDS_MAX },
      )
    end
  end
end
