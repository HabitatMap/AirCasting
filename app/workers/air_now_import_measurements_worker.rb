require 'sidekiq-scheduler'

class AirNowImportMeasurementsWorker
  include Sidekiq::Worker

  # At most one instance of OpenAqImportMeasurementsWorker must be run at once.
  #
  # If two or more instances of OpenAqImportMeasurementsWorker were to overlap and
  # run concurrently, they would insert duplicate sessions, streams and
  # measurements into the database.
  #
  # Whenever `SaveMeasurements` detects duplicate sessions, streams or measurements,
  # in the database it raises an error. That means duplications should always be detected.
  # Unfortunately, files containing measurements belonging to sessions and streams duplicated
  # in the database will not be processed anymore from that point on (because they would always
  # raise). But duplicates should not happen because AirNowImportMeasurementsWorker runs serially.
  #
  # We could have solved the concurrent inserts with a different architecture (e.g. unique
  # indexes in the database) but this seemed to be a simple and good enough solution.
  sidekiq_options lock: :until_executed, on_conflict: :log

  def perform
    return unless A9n.sidekiq_air_now_import_measurements_enabled

    AirNow::ImportMeasurements.new.call
  end
end
