class StreamValuesWorker
  include Sidekiq::Worker
  sidekiq_options queue: :default

  def perform(stream_id, measurements_attributes)
    stream = streams_repository.find(stream_id)
    time1 = Time.current
    calculate_bounding_box(stream, measurements_attributes)
    time2 = Time.current
    Sidekiq.logger.info "calc_bounding_box! in #{(time2 - time1).round(3)}"
    calculate_average_value!(stream, measurements_attributes)
    time3 = Time.current
    Sidekiq.logger.info "calc_average_value! in #{(time3 - time2).round(3)}"
    add_start_coordinates!(stream, measurements_attributes)
    time4 = Time.current
    Sidekiq.logger.info "add_start_coordinates! in #{(time4 - time3).round(3)}"
    stream.save!
    time5 = Time.current
    Sidekiq.logger.info "save! in #{(time5 - time4).round(3)}"
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
      measurements_attributes.sum { |m| m['value'] } /
        measurements_attributes.size
  end

  def calculate_bounding_box(stream, measurements_attributes)
    measurements =
      measurements_attributes.map do |m|
        Measurement.new(longitude: m['longitude'], latitude: m['latitude'])
      end
    streams_repository.calculate_bounding_box(stream, measurements)
  end
end
