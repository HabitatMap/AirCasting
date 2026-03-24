class Api::ScheduleStationStreamExport
  def initialize(contract:)
    @contract = contract
  end

  def call
    return Failure.new(contract.errors.to_h) if contract.failure?

    ExportStationStreamsWorker.perform_async(data[:station_stream_ids], data[:email])

    Success.new('Export scheduled successfully.')
  end

  private

  attr_reader :contract

  def data
    contract.to_h
  end
end
