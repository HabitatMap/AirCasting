class MeasurementSessionsController < ApplicationController
  layout 'map'

  def show
    form = Api::ParamsForm.new(params: params, schema: Api::Links::Schema, struct: Api::Links::Struct)
    result = Api::ToLink.new(form: form).call

    if result.success?
      redirect_to result.value
    else
      render json: result.errors, status: :bad_request
    end
  end

  def show_old
    # suporrts legacy mobile apps relesed before 06.2019
    session = Session.find_by_url_token(params[:url_token]) or raise NotFound

    selected_session_ids = [session.id]
    stream = session.streams.first!
    sensorId = stream.sensor_id

    data =
    { sensorId: sensorId,
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
      redirect_to fixed_map_path(:anchor => "?selectedSessionIds=#{selected_session_ids.to_json}&data=#{fix_data.to_json}")
    else
      redirect_to map_path(:anchor => "?selectedSessionIds=#{selected_session_ids.to_json}&data=#{data.to_json}")
    end
  end
end
