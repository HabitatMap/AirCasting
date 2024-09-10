module FixedSessions
  class IndexInteractor
    def initialize(
      form:,
      sessions_repository: SessionsRepository.new,
      fixed_sessions_serializer: FixedSessionsSerializer.new
    )
      @form = form
      @sessions_repository = sessions_repository
      @fixed_sessions_serializer = fixed_sessions_serializer
    end

    def call
      return Failure.new(form.errors) if form.invalid?
      sessions = sessions_repository.fixed_active_government_sessions(data)
      serialized_sessions = fixed_sessions_serializer.call(sessions)
      Success.new(serialized_sessions)
    end

    private

    attr_reader :form,
                :sessions_repository,
                :fixed_sessions_serializer

    def data
      form.to_h.to_h
    end
  end
end
