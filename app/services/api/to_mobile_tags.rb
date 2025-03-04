class Api::ToMobileTags
  def initialize(contract:)
    @contract = contract
  end

  def call
    return Failure.new(contract.errors.to_h) if contract.failure?

    sessions = MobileSession.filter_(data)

    session_ids = sessions.pluck(:id)
    return Success.new([]) if session_ids.empty?

    tags =
      TagsRepository.new.sessions_tags(
        session_ids: session_ids,
        input: data[:input],
      )

    Success.new(tags.rows.map { |row| row[0] })
  end

  private

  attr_reader :contract

  def data
    contract.to_h
  end
end
