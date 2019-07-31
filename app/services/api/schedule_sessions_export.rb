class Api::ScheduleSessionsExport
  def initialize(form:)
    @form = form
  end

  def call
    return Failure.new(form.errors) if form.invalid?

    ExportSessionsWorker.perform_async(data.session_ids, data.email)

    Success.new('Export scheduled successfully.')
  end

  private

  attr_reader :form

  def data
    form.to_h
  end
end
