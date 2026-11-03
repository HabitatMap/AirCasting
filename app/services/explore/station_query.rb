module Explore
  # GET /api/v3/explore/stations/{uuid}: one station in full, behind a marker on
  # the explore map, for either source.
  #
  # The uuid alone addresses it. `sessions.uuid` and `stations.uuid` are
  # separate columns in separate tables, but both are unique within their own
  # and neither is drawn from the other's values, so a client can follow a
  # marker without carrying its `source` back.
  #
  # Government first: `stations.uuid` is a real uuid column behind a unique
  # index, so its probe is the cheaper of the two and the common case — a
  # government station — costs one query. A uuid that is not in uuid format
  # skips that probe entirely: the column is typed, and Postgres raises on a
  # malformed literal rather than returning no rows.
  class StationQuery
    UUID_FORMAT = /\A\h{8}-\h{4}-\h{4}-\h{4}-\h{12}\z/

    def initialize(
      gov_query: GovStationQuery.new,
      airbeam_query: AirbeamStationQuery.new
    )
      @gov_query = gov_query
      @airbeam_query = airbeam_query
    end

    # nil when no public item of either source has this uuid.
    def call(uuid:)
      government(uuid) || airbeam_query.call(uuid: uuid)
    end

    private

    attr_reader :gov_query, :airbeam_query

    def government(uuid)
      return nil unless UUID_FORMAT.match?(uuid.to_s)

      gov_query.call(uuid: uuid)
    end
  end
end
