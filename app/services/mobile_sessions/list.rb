module MobileSessions
  # The signed-in user's own mobile sessions — metadata + per-stream aggregates,
  # NO measurements. Full authoritative set by default (so the client can treat a
  # locally-known session that is absent here as deleted); optional page/per_page
  # for the rare heavy account.
  class List
    def initialize(user:, page: nil, per_page: nil, serializer: SessionSerializer.new)
      @user = user
      @page = page
      @per_page = per_page
      @serializer = serializer
    end

    def call
      paginate(scope).map { |session| serializer.call(session) }
    end

    private

    attr_reader :user, :page, :per_page, :serializer

    def scope
      user
        .mobile_sessions
        .includes(:device, :tags, streams: :threshold_set)
        .order(start_time_local: :desc)
    end

    def paginate(relation)
      return relation unless per_page

      relation.offset((page.to_i.nonzero? || 1).pred * per_page.to_i).limit(per_page.to_i)
    end
  end
end
