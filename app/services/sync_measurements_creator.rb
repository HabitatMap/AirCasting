class SyncMeasurementsCreator
  def initialize(streams_repository: StreamsRepository.new)
    @streams_repository = streams_repository
  end

  def call(stream:, measurements_attributes:, jid: nil)
    if jid
      Sidekiq.logger.info "processing stream #{stream.id} with #{
                            measurements_attributes.count
                          } measurements"
    end
    time1 = Time.current
    stream.build_measurements!(measurements_attributes, jid)
    time2 = Time.current
    if jid
      Sidekiq.logger.info "build_measurements in #{(time2 - time1).round(3)}"
    end
    stream.after_measurements_created
    time3 = Time.current
    if jid
      Sidekiq.logger.info "after_measurements_created in #{
                            (time3 - time2).round(3)
                          }"
    end

    return if stream.session.type == 'FixedSession'
    streams_repository.calc_bounding_box!(stream)

    time4 = Time.current
    if jid
      Sidekiq.logger.info "calc_bounding_box! in #{(time4 - time3).round(3)}"
    end
    streams_repository.calc_average_value!(stream)
    time5 = Time.current
    if jid
      Sidekiq.logger.info "calc_average_value! in #{(time5 - time4).round(3)}"
    end
    streams_repository.add_start_coordinates!(stream)
    time6 = Time.current
    if jid
      Sidekiq.logger.info "add_start_coordinates! in #{
                            (time6 - time5).round(3)
                          }"
    end
  end

  private

  attr_reader :streams_repository
end
