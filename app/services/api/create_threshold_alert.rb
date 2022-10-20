module Api
  class CreateThresholdAlert
    def initialize(form:, user:)
      @form = form
      @user = user
    end

    def call
      return Failure.new(form.errors) if form.invalid?

      existing_alert = ThresholdAlert.where(
        session_uuid: data[:session_uuid],
        sensor_name: data[:sensor_name]
      ).first

      return Failure.new(['alert already exists']) if existing_alert

      alert = ThresholdAlert.create(
        user_id:         user.id,
        session_uuid:    data[:session_uuid],
        sensor_name:     data[:sensor_name],
        threshold_value: data[:threshold_value],
        frequency:       data[:frequency],
        timezone_offset: data[:timezone_offset]
      )

      Success.new(alert.id)
    end

    private
    attr_reader :form, :user

    def data
      form.to_h
    end
  end
end
