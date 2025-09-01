require 'sidekiq-scheduler'

class AirNowImportWorker
  include Sidekiq::Worker

  sidekiq_options lock: :until_executed, on_conflict: :log

  def perform
    return unless A9n.sidekiq_air_now_import_measurements_enabled

    AirNowStreaming::Interactor.new.call
  end
end
