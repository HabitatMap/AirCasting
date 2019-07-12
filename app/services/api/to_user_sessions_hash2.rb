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
        upload: new_in_mobile_app,
        download: new_in_db + outdated,
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
    user.sessions.where(uuid: sessions.map(&:uuid)).destroy_all
  end

  def deleted
    DeletedSession.where(user: user, uuid: data.map(&:uuid)).map(&:uuid)
  end

  def new_in_mobile_app
    uuids_present_in_mobile_app - uuids_present_in_db - deleted
  end

  def uuids_present_in_mobile_app
    uuids_present_in_mobile_app ||= present_in_mobile_app.map(&:uuid)
  end

  def present_in_mobile_app
    present_in_mobile_app ||= data.select { |datum| !datum.deleted }
  end

  def uuids_present_in_db
    uuids_present_in_db ||= present_in_db.map(&:uuid)
  end

  def present_in_db
    user.sessions.select(:uuid, :version)
  end

  def new_in_db
    uuids_present_in_db - uuids_present_in_mobile_app
  end

  def outdated
    present_in_db.select do |session_in_db|
      if uuids_present_in_mobile_app.exclude?(session_in_db.uuid)
        false
      else
        session_in_db.version >
          present_in_mobile_app.detect do |sessio_in_mobile_app|
            sessio_in_mobile_app.uuid == session_in_db.uuid
          end.version
      end
    end.map(&:uuid)
  end
end
