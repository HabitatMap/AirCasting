class StreamValuesWorker
  include Sidekiq::Worker
  sidekiq_options queue: :default

  def perform(stream_id, measurements_attributes)
    stream = streams_repository.find(stream_id)
    measurements_attributes = measurements_attributes.select do |params|
      params['value'].present? && params['longitude'].present? && params['latitude'].present?
    end
    return if measurements_attributes.empty?
    calculate_bounding_box(stream, measurements_attributes)
    calculate_average_value!(stream, measurements_attributes)
    add_start_coordinates!(stream, measurements_attributes)
    stream.save!
  end

  private

  def streams_repository
    @streams_repository ||= StreamsRepository.new
  end

  def add_start_coordinates!(stream, measurements_attributes)
    first_measurement = measurements_attributes.first
    stream.start_longitude = first_measurement['longitude']
    stream.start_latitude = first_measurement['latitude']
  end

  def calculate_average_value!(stream, measurements_attributes)
    stream.average_value =
      measurements_attributes.sum { |m| m['value'] } / measurements_attributes.size
  end

  def calculate_bounding_box(stream, measurements_attributes)
    measurements =
      measurements_attributes.map do |m|
        Measurement.new(longitude: m['longitude'], latitude: m['latitude'])
      end
    streams_repository.calculate_bounding_box(stream, measurements)
  end
end
