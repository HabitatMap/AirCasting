class Api::ScheduleSessionsExport
  def initialize(contract:)
    @contract = contract
  end

  def call
    return Failure.new(contract.errors.to_h) if contract.failure?

    limit_check = Api::ValidateSessionExportIds.call(session_ids: data[:session_ids])
    return limit_check if limit_check.failure?

    ExportSessionsWorker.perform_async(data[:session_ids], data[:email])

    Success.new('Export scheduled successfully.')
  end

  private

  attr_reader :contract

  def data
    contract.to_h
  end
end
