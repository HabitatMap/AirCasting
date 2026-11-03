module GovernmentSources
  # Writes the sites behind a parsed site list to `stations`, then hands each
  # stream its station's id, point and time zone, so a stream always sits where
  # its station does.
  #
  # The time zone is looked up only for a new station or one whose point
  # changed; an unchanged point keeps the zone already stored.
  class StationsUpserter
    FALLBACK_TIME_ZONE = 'UTC'.freeze
    URL_TOKEN_LENGTH = 5

    def initialize(
      repository: Repository.new,
      time_zone_finder: TimeZoneFinderWrapper.instance,
      token_generator: TokenGenerator.new
    )
      @repository = repository
      @time_zone_finder = time_zone_finder
      @token_generator = token_generator
    end

    def call(rows:, source_name:)
      return [] if rows.empty?

      source_id = repository.source_id(source_name: source_name)
      existing = repository.stations_by_external_ref(source_id: source_id)
      # Tokens minted earlier in this run are not in the database yet, so the
      # repository cannot see them. Without this the batch could mint the same
      # token twice and `upsert_all` would fail the whole batch on the unique
      # index -- `ON CONFLICT` is scoped to (source_id, external_ref) and does
      # not cover url_token.
      minted = Set.new

      sites =
        rows.group_by(&:station_external_ref).to_h do |ref, members|
          [ref, build_site(source_id, ref, members.first, existing[ref], minted)]
        end

      changed = sites.values.reject { |site| unchanged?(site, existing[site[:external_ref]]) }
      repository.upsert_stations(records: changed)

      station_ids = repository.station_ids_by_external_ref(source_id: source_id)
      rows.each do |row|
        site = sites.fetch(row.station_external_ref)
        row.station_id = station_ids.fetch(row.station_external_ref)
        row.source_id = source_id
        row.location = site[:location]
        row.time_zone = site[:time_zone]
      end
    end

    private

    attr_reader :repository, :time_zone_finder, :token_generator

    # Every row of one site carries the same name, point and monitor type in
    # the EPA V2 file, so the first row speaks for the site.
    def build_site(source_id, ref, row, current, minted)
      {
        source_id: source_id,
        external_ref: ref,
        title: row.title,
        location: build_location(row.latitude, row.longitude),
        time_zone: time_zone_for(row, current),
        excluded_reason: row.excluded_reason,
        # `current ?`, not `current&.url_token ||`: a station stored before
        # the column existed has no token, and minting one here would cost a
        # probe per station per run for a value `update_only` then drops.
        # `rake stations:backfill_url_tokens` is what fills those.
        url_token: current ? current.url_token : generate_url_token(minted),
      }
    end

    # Short, because a share link gets pasted into a message: five characters,
    # as sessions use. `Repository#upsert_stations` leaves url_token out of
    # `update_only`, so a station keeps the token it was first given -- a share
    # link that rotated on every ETL run would be worthless.
    def generate_url_token(minted)
      token_generator.generate_unique(URL_TOKEN_LENGTH) do |token|
        minted.add?(token) && repository.station_url_token_available?(token)
      end
    end

    def time_zone_for(row, current)
      if current &&
           GovernmentSources.same_point?(current.location, row.latitude, row.longitude)
        return current.time_zone
      end

      # The finder knows land only. A point at sea -- a bad coordinate, e.g.
      # EPA 840210890008 at 50,-150 -- has no zone, and time_zone is NOT NULL.
      time_zone_finder.time_zone_at(lat: row.latitude, lng: row.longitude) ||
        FALLBACK_TIME_ZONE
    end

    def unchanged?(site, current)
      current.present? && current.title == site[:title] &&
        GovernmentSources.same_point?(
          current.location,
          site[:location].y,
          site[:location].x,
        ) &&
        current.time_zone == site[:time_zone] &&
        current.excluded_reason == site[:excluded_reason]
    end

    def build_location(latitude, longitude)
      RGeo::Geographic.spherical_factory(srid: 4326).point(longitude, latitude)
    end
  end
end
