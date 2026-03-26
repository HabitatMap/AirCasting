module Api
  class ExportStationStreamsContract < Dry::Validation::Contract
    params do
      required(:email).filled(:string)
      required(:station_stream_ids).array(:integer)
    end
  end
end
