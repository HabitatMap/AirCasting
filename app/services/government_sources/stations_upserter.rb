module GovernmentSources
  # Writes the sites behind a parsed site list to `stations`, then hands each
  # stream its station's id, point and time zone, so a stream always sits where
  # its station does.
  #
  # The time zone is looked up only for a new station or one whose point
  # changed; an unchanged point keeps the zone already stored.
  class StationsUpserter
    FALLBACK_TIME_ZONE = 'UTC'.freeze

    def initialize(
      repository: Repository.new,
      time_zone_finder: TimeZoneFinderWrapper.instance
    )
      @repository = repository
      @time_zone_finder = time_zone_finder
    end

    def call(stations:, source_name:)
      return [] if stations.empty?

      source_id = repository.source_id(source_name: source_name)
      existing = repository.stations_by_external_ref(source_id: source_id)

      sites =
        stations.group_by(&:station_external_ref).to_h do |ref, members|
          [ref, build_site(source_id, ref, members.first, existing[ref])]
        end

      changed = sites.values.reject { |site| unchanged?(site, existing[site[:external_ref]]) }
      repository.upsert_stations(records: changed)

      station_ids = repository.station_ids_by_external_ref(source_id: source_id)
      stations.each do |station|
        site = sites.fetch(station.station_external_ref)
        station.station_id = station_ids.fetch(station.station_external_ref)
        station.source_id = source_id
        station.location = site[:location]
        station.time_zone = site[:time_zone]
      end
    end

    private

    attr_reader :repository, :time_zone_finder

    # Every row of one site carries the same name, point and monitor type in
    # the EPA V2 file, so the first row speaks for the site.
    def build_site(source_id, ref, row, current)
      {
        source_id: source_id,
        external_ref: ref,
        title: row.title,
        location: build_location(row.latitude, row.longitude),
        time_zone: time_zone_for(row, current),
        excluded_reason: row.excluded_reason,
      }
    end

    def time_zone_for(row, current)
      if current && Stations.same_point?(current.location, row.latitude, row.longitude)
        return current.time_zone
      end

      # The finder knows land only. A point at sea -- a bad coordinate, e.g.
      # EPA 840210890008 at 50,-150 -- has no zone, and time_zone is NOT NULL.
      time_zone_finder.time_zone_at(lat: row.latitude, lng: row.longitude) ||
        FALLBACK_TIME_ZONE
    end

    def unchanged?(site, current)
      current.present? && current.title == site[:title] &&
        Stations.same_point?(current.location, site[:location].y, site[:location].x) &&
        current.time_zone == site[:time_zone] &&
        current.excluded_reason == site[:excluded_reason]
    end

    def build_location(latitude, longitude)
      RGeo::Geographic.spherical_factory(srid: 4326).point(longitude, latitude)
    end
  end
end
