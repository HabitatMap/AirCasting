module Api
  class CreateThresholdAlert
    def initialize(form:, user:, streams_repository: StreamsRepository.new)
      @form = form
      @user = user
      @streams_repository = streams_repository
    end

    def call
      return Failure.new(form.errors) if form.invalid?

      alert =
        ThresholdAlert.create(
          user_id: user.id,
          session_uuid: data[:session_uuid],
          sensor_name: data[:sensor_name],
          threshold_value: data[:threshold_value],
          frequency: data[:frequency],
          timezone_offset: data[:timezone_offset],
          stream_id: stream.id,
        )

      if alert.persisted?
        Success.new(alert.id)
      else
        Failure.new(['something went wrong'])
      end
    end

    private

    attr_reader :form, :user, :streams_repository

    def data
      form.to_h
    end

    def stream
      streams_repository.find_by_session_uuid_and_sensor_name(
        session_uuid: data[:session_uuid],
        sensor_name: data[:sensor_name],
      )
    end
  end
end
