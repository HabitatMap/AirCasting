module MobileSessions
  # The signed-in user's own mobile sessions — metadata + per-stream aggregates,
  # NO measurements.
  #
  # Authoritative: a session absent from a full walk has been deleted, which is
  # why `meta` reports the real `total`, not the page size.
  #
  # Ordered by id, not start_time_local: the latter is NULL until measurements
  # land, so it ties every fresh session with every other and offset paging then
  # drops and repeats rows.
  class List
    MAX_PER_PAGE = Api::ListMobileSessionsContract::MAX_PER_PAGE
    DEFAULT_PER_PAGE = MAX_PER_PAGE

    def initialize(user:, page: nil, per_page: nil, serializer: SessionSerializer.new)
      @user = user
      @page = clamp(page, default: 1)
      @per_page = [clamp(per_page, default: DEFAULT_PER_PAGE), MAX_PER_PAGE].min
      @serializer = serializer
    end

    def call
      total = base.count

      {
        sessions: paginate(scope).map { |session| serializer.call(session) },
        meta: {
          total: total,
          page: page,
          per_page: per_page,
          total_pages: (total / per_page.to_f).ceil,
        },
      }
    end

    private

    attr_reader :user, :page, :per_page, :serializer

    # Requests are already validated by the contract; this guards other callers.
    def clamp(value, default:)
      integer = value.to_s.to_i
      integer.positive? ? integer : default
    end

    # No eager loads: `total` is a plain COUNT, not a reason to hydrate rows.
    def base
      user.mobile_sessions
    end

    def scope
      base
        .includes(:device, :tags, streams: :threshold_set)
        .order(id: :desc)
    end

    def paginate(relation)
      relation.offset((page - 1) * per_page).limit(per_page)
    end
  end
end
