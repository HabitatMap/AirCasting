module FixedSessions
  # The signed-in user's own fixed sessions — metadata + per-stream identity and
  # each stream's newest reading, NO measurement history.
  #
  # Authoritative: a session absent from a full walk has been deleted, which is
  # why `meta` reports the real `total`, not the page size.
  #
  # Ordered by id, not start_time_local: id is unique, so a page boundary can
  # never split or duplicate a tie. Ascending, so a session created mid-walk takes
  # the highest id and lands past the cursor instead of shifting the pages already
  # fetched. Residue: a session deleted mid-walk shifts later rows up, so one live
  # session can be skipped and read as deleted — self-heals on the next walk;
  # keyset paging is the fix if that ever stops being rare.
  class List
    MAX_PER_PAGE = Api::ListFixedSessionsContract::MAX_PER_PAGE
    DEFAULT_PER_PAGE = MAX_PER_PAGE

    def initialize(
      user:,
      page: nil,
      per_page: nil,
      serializer: SessionSerializer.new,
      fixed_measurements_repository: FixedMeasurementsRepository.new
    )
      @user = user
      @page = clamp(page, default: 1)
      @per_page = [clamp(per_page, default: DEFAULT_PER_PAGE), MAX_PER_PAGE].min
      @serializer = serializer
      @fixed_measurements_repository = fixed_measurements_repository
    end

    def call
      total = base.count
      sessions = paginate(scope).to_a
      latest_measurements = latest_measurements_for(sessions)

      {
        sessions: sessions.map do |session|
          serializer.call(session, latest_measurements: latest_measurements)
        end,
        meta: {
          total: total,
          page: page,
          per_page: per_page,
          total_pages: (total / per_page.to_f).ceil,
        },
      }
    end

    private

    attr_reader :user, :page, :per_page, :serializer, :fixed_measurements_repository

    # Requests are already validated by the contract; this guards other callers.
    # Whole value or nothing — `'10abc'.to_i` reading as 10 is the same silent
    # half-interpretation the contract exists to prevent.
    def clamp(value, default:)
      integer = Integer(value, exception: false)
      integer&.positive? ? integer : default
    end

    # No eager loads: `total` is a plain COUNT, not a reason to hydrate rows.
    def base
      user.fixed_sessions
    end

    def scope
      base
        .includes(:device, :tags, streams: :threshold_set)
        .order(id: :asc)
    end

    def paginate(relation)
      relation.offset((page - 1) * per_page).limit(per_page)
    end

    # One query for the whole page, not one per stream: a fixed session runs for
    # months, so the newest row has to come off the index rather than out of a
    # loaded association.
    def latest_measurements_for(sessions)
      fixed_measurements_repository.latest_by_stream_id(
        stream_ids: sessions.flat_map { |session| session.streams.map(&:id) },
      )
    end
  end
end
