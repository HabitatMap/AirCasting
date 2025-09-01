module DataFixes
  class AirNowSessionsLatLongRounding
    def initialize(
      logger: Logger.new(
        Rails.root.join('log', 'air_now_sessions_lat_long_rounding.log'),
      )
    )
      @logger = logger
    end

    def call
      AirNowStreaming::Repository
        .new
        .air_now_streams
        .find_each
        .with_index do |stream, index|
        session = stream.session

        logger.info("Processing session #{index + 1} with ID: #{session.id}")

        latitude = session.latitude.round(3)
        longitude = session.longitude.round(3)

        ActiveRecord::Base.transaction do
          session.update!(latitude: latitude, longitude: longitude)
          logger.info(
            "Updated session ID: #{session.id} with rounded latitude: #{latitude}, longitude: #{longitude}",
          )

          stream.update!(
            min_latitude: latitude,
            min_longitude: longitude,
            max_latitude: latitude,
            max_longitude: longitude,
            start_latitude: latitude,
            start_longitude: longitude,
          )
          logger.info(
            "Updated stream ID: #{stream.id} for session ID: #{session.id}",
          )
        end
      rescue ActiveRecord::RecordInvalid => e
        logger.error(
          "Failed to update session ID: #{session.id} - #{e.message}",
        )
      end

      logger.info('Finished processing all sessions.')
    end

    private

    attr_reader :logger
  end
end
