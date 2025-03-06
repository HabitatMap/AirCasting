class Api::UserSessionsController < Api::BaseController
  # TokenAuthenticatable was removed from Devise in 3.1
  # https://gist.github.com/josevalim/fb706b1e933ef01e4fb6
  before_action :authenticate_user_from_token!
  before_action :authenticate_user!

  respond_to :json

  def sync_with_versioning
    contract =
      Api::UserSessions2Contract.new.call({ data: JSON.parse(params[:data]) })
    result =
      Api::ToUserSessionsHash2.new(contract: contract, user: current_user).call

    if result.success?
      render json: result.value, status: :ok
    else
      render json: result.errors, status: :bad_request
    end
  end

  def update_session
    form =
      Api::JsonForm.new(
        json: params.to_unsafe_hash[:data],
        schema: Api::UserSession::Schema,
        struct: Api::UserSession::Struct,
      )
    result = Api::UpdateSession.new(form: form).call

    if result.success?
      render json: result.value, status: :ok
    else
      render json: result.errors, status: :bad_request
    end
  end

  def show
    session =
      (
        current_user.sessions.find_by_id(params[:id]) or
          current_user.sessions.find_by_uuid(params[:uuid])
      ) or raise NotFound

    stream_measurements = params[:stream_measurements] == 'true'

    response =
      session
        .as_synchronizable(stream_measurements)
        .merge('location' => short_session_url(session, host: A9n.host_))
        .merge('tag_list' => session.tag_list.join(' '))
        .merge('notes' => prepare_notes(session.notes))

    respond_with Oj.dump(response, mode: :compat, use_as_json: true)
  end

  def delete_session
    data = decode_and_deep_symbolize(params)

    a_session = current_user.sessions.find_by_uuid(data[:uuid])
    if a_session
      a_session.destroy
      render json: { success: true }
    else
      render json: { success: false, no_such_session: true }
    end
  end

  def delete_session_streams
    session_data = decode_and_deep_symbolize(params)

    a_session = current_user.mobile_sessions.find_by_uuid(session_data[:uuid])

    if a_session
      (session_data[:streams] || []).each do |key, stream_data|
        if stream_data[:deleted]
          a_session
            .streams
            .where(
              sensor_package_name: stream_data[:sensor_package_name],
              sensor_name: stream_data[:sensor_name],
            )
            .each(&:destroy)
        end
      end
      render json: { success: true }
    else
      render json: { success: false, no_such_session: true }
    end
  end

  private

  def decode_and_deep_symbolize(params)
    if params[:compression]
      decoded = Base64.decode64(params[:session])
      session_json = AirCasting::GZip.inflate(decoded)
    else
      session_json = params[:session]
    end

    data = JSON.parse(session_json)
    data = deep_symbolize(data)
  end

  def prepare_notes(notes)
    notes.map do |note|
      note.as_json.merge(photo_location: photo_location(note))
    end
  end

  def to_json_data(params)
    "{ \"data\": #{params.to_unsafe_hash[:data] || []} }"
  end
end
