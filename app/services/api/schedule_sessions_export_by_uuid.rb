class Api::ScheduleSessionsExportByUuid
  def initialize(contract:)
    @contract = contract
  end

  def call
    return Failure.new(contract.errors) if contract.failure?

    session = ::Session.find_by_uuid(data[:uuid])
    unless session
      return(
        Failure.new(
          { error: "Session with uuid: #{data[:uuid]} doesn't exist" },
        )
      )
    end
    ExportSessionsWorker.perform_async([session.id], email)

    Success.new({ success_message: 'Export scheduled successfully.' })
  end

  private

  attr_reader :contract

  def data
    contract.to_h
  end

  def email
    URI.decode(data[:email])
  end
end
