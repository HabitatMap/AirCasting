include Rails.application.routes.url_helpers

class Api::ToLink
  def initialize(form:)
    @form = form
  end

  def call
    return Failure.new(form.errors) if form.invalid?

    session = ::Session.find_by_url_token(params[:url_token]) or raise NotFound
    selected_session_ids = [session.id]
    stream = session.streams.where(sensor_name: params[:sensor_name]).first!

    data =
    { sensorId: stream.sensor_id,
      usernames: session.user.username,
      heat: { highest: stream.threshold_very_high,
              high: stream.threshold_high,
              mid: stream.threshold_medium,
              low: stream.threshold_low,
              lowest: stream.threshold_very_low },
    }

    if (session.type == "FixedSession")
      fix_data = data.merge(
          isIndoor: session.is_indoor,
          isStreaming: (session.last_measurement_at > Time.current - 1.hour)
        )
      Success.new(fixed_map_path(:anchor => "?selectedSessionIds=#{selected_session_ids.to_json}&data=#{fix_data.to_json}"))
    else
      Success.new(map_path(:anchor => "?selectedSessionIds=#{selected_session_ids.to_json}&data=#{data.to_json}"))
    end
  end

  private

  attr_reader :form

  def params
    form.to_h
  end
end
