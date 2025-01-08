class Api::ToUserSessionsHash2
  def initialize(form:, user:)
    @form = form
    @user = user
  end

  def call
    return Failure.new(form.errors) if form.invalid?

    delete_sessions(data.select(&:deleted))

    Success.new(
      {
        upload: new_in_params,
        download: new_in_database + outdated,
        deleted: deleted,
      },
    )
  end

  private

  attr_reader :form, :user

  def data
    form.to_h.data
  end

  def delete_sessions(sessions)
    sessions = Session.where(uuid: sessions.pluck(:uuid))
    streams = Stream.where(session: sessions)
    streams.update_all(last_hourly_average_id: nil)
    sessions.destroy_all
  end

  def deleted
    DeletedSession.where(user: user, uuid: data.pluck(:uuid)).pluck(:uuid)
  end

  def new_in_params
    uuids_present_in_params - uuids_present_in_database - deleted
  end

  def uuids_present_in_params
    @uuids_present_in_params ||= present_in_params.pluck(:uuid)
  end

  def present_in_params
    @present_in_params ||= data.select { |datum| !datum.deleted }
  end

  def uuids_present_in_database
    @uuids_present_in_database ||= present_in_database.pluck(:uuid)
  end

  def present_in_database
    user
      .sessions
      .reduce([]) do |acc, session|
        if (session.streams.count != 0) &&
             (session.streams.all? { |stream| stream.measurements.count != 0 })
          acc.push(
            OpenStruct.new({ uuid: session.uuid, version: session.version }),
          )
        end

        acc
      end
  end

  def new_in_database
    uuids_present_in_database - uuids_present_in_params
  end

  def outdated
    present_in_database
      .select do |session_in_database|
        uuids_present_in_params.include?(session_in_database.uuid)
      end
      .select do |session_in_database|
        session_in_database.version >
          present_in_params.find do |session_in_params|
            session_in_params.uuid == session_in_database.uuid
          end.version
      end
      .pluck(:uuid)
  end
end
