require 'sidekiq-scheduler'

class OpenAqImportMeasurementsWorker
  include Sidekiq::Worker

  def perform
    return unless A9n.sidekiq_open_aq_import_measurements_enabled

    OpenAq::ImportMeasurements.new.call
  end
end
