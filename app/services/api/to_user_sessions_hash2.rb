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

  def delete_sessions(session)
    session.map { |session| user.sessions.find_by_uuid(session.uuid) }.compact
      .each(&:destroy)
  end

  def deleted
    DeletedSession.where(user: user, uuid: data.map(&:uuid)).map(&:uuid)
  end

  def present_in_mobile_app
    data.select { |datum| !datum.deleted }
  end

  def present_in_db
    user.sessions.select(:uuid, :version)
  end

  def new_in_db
    present_in_db.map(&:uuid) - present_in_mobile_app.map(&:uuid)
  end

  def old_in_db
    present_in_db.select do |ses|
      present_in_mobile_app.map(&:uuid).include?(ses.uuid)
    end
  end

  def outdated
    old_in_db.select do |ses|
      ses.version >
        present_in_mobile_app.detect { |ses2| ses2.uuid == ses.uuid }.version
    end.map(&:uuid)
  end

  def new_in_mobile_app
    present_in_mobile_app.map(&:uuid) - (present_in_db.map(&:uuid) + deleted)
  end
end
