class MeasurementsCreator
  SLICE_SIZE = 500

  def self.call(stream, measurements_attributes)
    if measurements_attributes.count == 1
      SyncMeasurementsCreator.new.call(stream, measurements_attributes)
    else
      measurements_attributes.each_slice(SLICE_SIZE) do |measurement_attributes|
        AsyncMeasurementsCreator.perform_async(stream.id, measurement_attributes)
      end
    end
  end
end
