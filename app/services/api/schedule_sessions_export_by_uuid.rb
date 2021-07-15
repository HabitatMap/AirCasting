class Api::ScheduleSessionsExportByUuid
  def initialize(form:)
    @form = form
  end

  def call
    return Failure.new(form.errors) if form.invalid?

    session = ::Session.find_by_uuid(data.uuid)
    unless session
      return(
        Failure.new(
          { error: "Session with uuid: #{data[:uuid]} doesn't exist" }
        )
      )
    end
    ExportSessionsWorker.perform_async([session.id], email)

    Success.new({ success_message: 'Export scheduled successfully.' })
  end

  private

  attr_reader :form

  def data
    form.to_h
  end

  def email
    URI.decode(data.email)
  end
end
