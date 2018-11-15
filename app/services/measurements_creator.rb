class MeasurementsCreator
  SLICE_SIZE = 500

  def self.call(stream, measurements_attributes)
    if stream.session.type == "FixedSession"
      measurements_attributes = measurements_attributes.map do |measurement_attributes|
        measurement_attributes[:utc_time] = Time.now.utc
        measurement_attributes
      end
    end

    if measurements_attributes.count == 1
      new.call(stream, measurements_attributes)
    else
      measurements_attributes.each_slice(SLICE_SIZE) do |measurement_attributes|
        AsyncMeasurementsCreator.perform_async(stream.id, measurement_attributes)
      end
    end
  end

  def initialize(streams_repository = StreamsRepository.new)
    @streams_repository = streams_repository
  end

  def call(stream, measurements_attributes)
    stream.build_measurements!(measurements_attributes)
    stream.after_measurements_created

    return if stream.session.type == 'FixedSession'
    streams_repository.calc_bounding_box!(stream)
    streams_repository.calc_average_value!(stream)
  end

  private

  attr_reader :streams_repository
end
