class PurpleAirImportMeasurementsWorker
  include Sidekiq::Worker

  # At most one instance of PurpleAirImportMeasurementsWorker must be run at once.
  #
  # If two or more instances of PurpleAirImportMeasurementsWorker were to overlap and
  # run concurrently, they would insert duplicate sessions, streams and
  # measurements into the database.
  # That could happen either by processing the same measurement file from AWS S3 or
  # different ones where file_1 and file_2 contain measurements belonging to the same
  # session and stream.
  #
  # Whenever `SaveMeasurements` detects duplicate sessions, streams or measurements,
  # in the database it raises an error. That means duplications should always be detected.
  # Unfortunately, files containing measurements belonging to sessions and streams duplicated
  # in the database will not be processed anymore from that point on (because they would always
  # raise). But duplicates should not happen because PurpleAirImportMeasurementsWorker runs serially.
  #
  # We could have solved the concurrent inserts with a different architecture (e.g. unique
  # indexes in the database) but this seemed to be a simple and good enough solution.
  sidekiq_options lock: :until_executed, on_conflict: :log

  def perform
    return unless A9n.sidekiq_purple_air_import_measurements_enabled

    PurpleAir::ImportMeasurements.new.call
  end
end
