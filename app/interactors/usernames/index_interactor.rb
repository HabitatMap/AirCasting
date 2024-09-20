module Usernames
  class IndexInteractor
    def initialize(form:)
      @form = form
    end

    def call
      return Failure.new(form.errors) if form.invalid?

      case data[:session_type]
      when 'fixed'
        case data[:is_dormant]
        when 'true'
          sessions = FixedSession.dormant
        when 'false'
          sessions = FixedSession.active
        end
      when 'mobile'
        sessions = MobileSession.all
      end

      sessions_usernames =
        sessions
          .filter_(data)
          .includes(:user)
          .where('username ILIKE ?', "#{data[:input]}%")
          .order(:username)
          .pluck(:username)
          .uniq
          .sort

      Success.new(sessions_usernames)
    end

    private

    attr_reader :form

    def data
      form.to_h.to_h
    end
  end
end
