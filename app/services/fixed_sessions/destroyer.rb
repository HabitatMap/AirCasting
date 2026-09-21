module FixedSessions
  class Destroyer
    def call(session:)
      ActiveRecord::Base.transaction do
        stream_ids = session.streams.pluck(:id)

        delete_stream_children(stream_ids)
        Stream.where(id: stream_ids).delete_all

        session.destroy!
      end

      Success.new(session: session)
    rescue ActiveRecord::LockWaitTimeout, ActiveRecord::QueryCanceled => e
      Rails.logger.warn("[FixedSessions::Destroyer] #{e.class}: #{e.message}")
      Failure.new(
        error_code: BinaryProtocol::ErrorCodes::TRY_AGAIN_LATER,
        message: 'Could not delete this session, please retry',
      )
    rescue ActiveRecord::ActiveRecordError => e
      Rails.logger.warn("[FixedSessions::Destroyer] #{e.class}: #{e.message}")
      Failure.new(
        error_code: BinaryProtocol::ErrorCodes::INTERNAL_ERROR,
        message: 'Could not delete this session',
      )
    end

    private

    def delete_stream_children(stream_ids)
      return if stream_ids.empty?

      # Must precede the StreamHourlyAverage delete: the pointer is a foreign key
      # onto the rows being deleted.
      Stream.where(id: stream_ids).update_all(last_hourly_average_id: nil)

      StreamHourlyAverage.where(stream_id: stream_ids).delete_all
      StreamDailyAverage.where(stream_id: stream_ids).delete_all
      ThresholdAlert.where(stream_id: stream_ids).delete_all
      Measurement.where(stream_id: stream_ids).delete_all
      FixedMeasurement.where(stream_id: stream_ids).delete_all
    end
  end
end
