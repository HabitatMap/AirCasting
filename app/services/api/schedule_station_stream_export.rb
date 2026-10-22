class Api::ScheduleStationStreamExport
  def initialize(contract:)
    @contract = contract
  end

  def call
    # The message set, not `to_h`: `to_h` throws away the failing predicate,
    # and `ValidationErrorsSerializer` needs it to give each field a code.
    return Failure.new(contract.errors) if contract.failure?

    ExportStationStreamsWorker.perform_async(data[:station_stream_ids], data[:email])

    Success.new('Export scheduled successfully.')
  end

  private

  attr_reader :contract

  def data
    contract.to_h
  end
end
