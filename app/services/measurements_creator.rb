class MeasurementsCreator
  SLICE_SIZE = 500

  def self.call(stream, measurements_attributes)
    measurements_attributes.each_slice(SLICE_SIZE) do |measurement_attributes|
      AsyncMeasurementsCreator.perform_async(stream.id, measurement_attributes)
    end
  end

  def call(stream, measurements_attributes)
    stream.build_measurements!(measurements_attributes)
    stream.calc_bounding_box!
    stream.calc_average_value!
    stream.after_measurements_created
  end
end
