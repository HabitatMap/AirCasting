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
        deleted: deleted
      }
    )
  end

  private

  attr_reader :form, :user

  def data
    form.to_h.data
  end

  def delete_sessions(sessions)
    user.sessions.where(uuid: sessions.pluck(:uuid)).destroy_all
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
    user.sessions.select(:uuid, :version)
  end

  def new_in_database
    uuids_present_in_database - uuids_present_in_params
  end

  def outdated
    present_in_database.select do |session_in_database|
      uuids_present_in_params.include?(session_in_database.uuid)
    end.select do |session_in_database|
        session_in_database.version >
          present_in_params.detect do |session_in_params|
            session_in_params.uuid == session_in_database.uuid
          end.version
    end.pluck(:uuid)
  end
end
