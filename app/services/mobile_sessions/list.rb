module MobileSessions
  # The signed-in user's own mobile sessions — metadata + per-stream aggregates,
  # NO measurements.
  #
  # Authoritative: a session absent from a full walk has been deleted, which is
  # why `meta` reports the real `total`, not the page size.
  #
  # Ordered by id, not start_time_local: the latter is NULL until measurements
  # land, so it ties every fresh session and offset paging drops and repeats rows.
  #
  # Descending, so the newest sessions are on page 1 and a client can render them
  # while the older pages load behind it.
  #
  # Residue of descending + offset paging, both self-healing on the next walk.
  # A session created mid-walk takes the highest id and lands on page 1, which
  # the walk has already passed: every later page shifts by one, so one session
  # repeats and the new one waits for the next walk. Nothing is omitted, so the
  # "absent means deleted" contract holds. A session deleted mid-walk is the one
  # that can omit — it pulls the rows behind it forward over the cursor, so one
  # live session can be skipped and read as deleted. Acceptable because
  # DEFAULT_PER_PAGE is 500, so only an account above that ever pages at all;
  # keyset paging is the fix if that stops being rare.
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
    # Whole value or nothing — `'10abc'.to_i` reading as 10 is the same silent
    # half-interpretation the contract exists to prevent.
    def clamp(value, default:)
      integer = Integer(value, exception: false)
      integer&.positive? ? integer : default
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
