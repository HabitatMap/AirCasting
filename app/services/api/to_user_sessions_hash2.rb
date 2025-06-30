class Api::ToUserSessionsHash2
  def initialize(contract:, user:)
    @contract = contract
    @user = user
  end

  def call
    return Failure.new(contract.errors.to_h) if contract.failure?

    delete_sessions(data.select { |session| session[:deleted] })

    Success.new(
      {
        upload: new_in_params,
        download: new_in_database + outdated,
        deleted: deleted,
      },
    )
  end

  private

  attr_reader :contract, :user

  def data
    contract.to_h[:data]
  end

  def delete_sessions(sessions)
    uuids_to_delete = sessions.pluck(:uuid)
    sessions = Session.where(uuid: uuids_to_delete)

    UserSessionsSyncing::Deleter.new.call(sessions: sessions)
    uuids_to_delete.each do |uuid|
      DeletedSession.where(uuid: uuid, user_id: user.id).first_or_create!
    end
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
    @present_in_params ||= data.select { |datum| !datum[:deleted] }
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
            session_in_params[:uuid] == session_in_database.uuid
          end[
            :version
          ]
      end
      .pluck(:uuid)
  end
end
