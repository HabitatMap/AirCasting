class SyncMeasurementsCreator
  def call(stream:, measurements_attributes:)
    stream.build_measurements!(measurements_attributes)
    stream.after_measurements_created
  end
end
