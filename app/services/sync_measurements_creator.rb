class SyncMeasurementsCreator
  def initialize(streams_repository: StreamsRepository.new)
    @streams_repository = streams_repository
  end

  def call(stream:, measurements_attributes:, jid: nil)
    stream.build_measurements!(measurements_attributes, jid)
    stream.after_measurements_created

    return if stream.session.type == 'FixedSession'
    streams_repository.calc_bounding_box!(stream)
    streams_repository.calc_average_value!(stream)
    streams_repository.add_start_coordinates!(stream)
  end

  private

  attr_reader :streams_repository
end
