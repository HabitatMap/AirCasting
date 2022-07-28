module Api
  class CreateThresholdAlert
    def initialize(form:, user:)
      @form = form
      @user = user
    end

    def call
      return Failure.new(form.errors) if form.invalid?

      session = FixedSession.joins(:streams).find_by_uuid(data[:session_uuid])

      alert = ThresholdAlert.create(
        user_id:         user.id,
        session_uuid:    session.uuid,
        sensor_name:     data[:sensor_name],
        threshold_value: data[:threshold_value],
        frequency:       data[:frequency]
      )

      Success.new(
        alert: alert
      )
    end

    private
    attr_reader :form, :user

    def data
      form.to_h
    end
  end
end