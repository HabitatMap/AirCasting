require 'sidekiq-scheduler'

class OpenAqImportMeasurementsWorker
  include Sidekiq::Worker

  def perform
    OpenAq::ImportMeasurements.new.call
  end
end
