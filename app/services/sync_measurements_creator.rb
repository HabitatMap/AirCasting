class SyncMeasurementsCreator
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
  end
end
