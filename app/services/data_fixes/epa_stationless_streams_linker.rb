module DataFixes
  # Links EPA station streams that have no station, using the site list of the
  # day each stream last reported. The station import links every stream whose
  # ref is in today's list; what it leaves are streams of sites that have since
  # left the list, and UNMATCHED-<session uuid> streams that EpaDataMigrator
  # could not key.
  #
  # Matching, against the site list of the stream's last_measured_at date (UTC):
  # - a real ref by (ref, measurement type);
  # - an UNMATCHED stream the way EpaDataMigrator matched it: its point rounded
  #   to 3 decimals, plus measurement type.
  # A stream is linked only when every matching row belongs to one station. A
  # station missing from `stations` is created from that day's row.
  #
  # An UNMATCHED stream that day's list does not resolve falls back to its
  # legacy session, whose uuid the ref carries. AirNowStreaming created and fed
  # that session from the v1 site list, keyed by the point of each AQSID's
  # first row. The v1 list of the day it last fed the session, else of the day
  # it created it, names the AQSID; the V2 list of that day gives the station.
  #
  # An UNMATCHED stream whose match is a single ref also takes that ref, so
  # ingest feeds it again. If a stream with that ref exists and has never
  # measured anything (the import creates one for every ref in the list), it
  # is deleted first; if it has data, the UNMATCHED stream is only linked.
  #
  # Point, time zone and title are left alone: the import aligns them once the
  # stream's ref is in its site list.
  class EpaStationlessStreamsLinker
    UNMATCHED_PREFIX = 'UNMATCHED-'.freeze
    V1_FIELD_AQSID = 0
    V1_FIELD_PARAMETER_NAME = 1
    V1_FIELD_LATITUDE = 8
    V1_FIELD_LONGITUDE = 9

    def initialize(
      api_client: Epa::ApiClient.new,
      data_parser: Epa::Stations::DataParser.new,
      stations_upserter: GovernmentSources::StationsUpserter.new,
      repository: GovernmentSources::Repository.new,
      cache_dir: nil,
      logger: Logger.new($stdout)
    )
      @api_client = api_client
      @data_parser = data_parser
      @stations_upserter = stations_upserter
      @repository = repository
      @cache_dir = cache_dir && Pathname(cache_dir)
      @logger = logger
    end

    # Writes nothing unless apply: true. Returns the count per action.
    def call(apply: false)
      @apply = apply
      @source_id = repository.source_id(source_name: :epa)
      @station_ids = repository.station_ids_by_external_ref(source_id: source_id)
      @claimed_keys = Set.new
      @counts = Hash.new(0)
      @site_lists = {}
      @v1_site_lists = {}

      streams =
        StationStream
          .where(source_id: source_id, station_id: nil)
          .includes(:stream_configuration)
          .order(:id)
          .to_a
      never_measured, measured = streams.partition { |s| s.last_measured_at.nil? }

      log("#{apply ? 'APPLY' : 'DRY RUN'}: #{streams.size} streams without a station")
      never_measured.each { |stream| report(stream, nil, :never_measured) }

      # Newest first, so a station missing from `stations` is created from
      # the latest row describing it.
      measured
        .group_by { |s| s.last_measured_at.utc.to_date }
        .sort
        .reverse_each { |date, group| link_group(date, group) }

      log("Summary: #{counts.sort.to_h}")
      counts
    end

    private

    attr_reader :api_client,
                :data_parser,
                :stations_upserter,
                :repository,
                :cache_dir,
                :logger,
                :apply,
                :source_id,
                :station_ids,
                :claimed_keys,
                :counts,
                :site_lists,
                :v1_site_lists

    def link_group(date, streams)
      rows = site_list(date) || []
      by_ref = rows.index_by { |r| [r.external_ref, r.measurement_type] }
      by_point =
        rows.group_by { |r| point_key(r.latitude, r.longitude, r.measurement_type) }

      streams.each do |stream|
        type = stream.stream_configuration.measurement_type
        candidates =
          if unmatched?(stream)
            by_point.fetch(point_key(stream.location.y, stream.location.x, type), [])
          else
            [by_ref[[stream.external_ref, type]]].compact
          end

        if unmatched?(stream) && station_refs(candidates).size != 1
          session_date, session_candidates = legacy_session_match(stream)
          if session_candidates
            next link(stream, session_date, session_candidates, 'via=legacy_session')
          end
        end
        next report(stream, date, :no_site_list) unless site_list(date)

        link(stream, date, candidates)
      end
    end

    def link(stream, date, candidates, note = nil)
      return report(stream, date, :no_match) if candidates.empty?

      if station_refs(candidates).size > 1
        return report(stream, date, :ambiguous, "stations=#{station_refs(candidates).join(',')}")
      end

      row = candidates.first
      new_ref, twin, action = rekey_plan(stream, candidates)
      new_station = !station_ids.key?(row.station_external_ref)
      details = [note, "station=#{row.station_external_ref}#{' (new)' if new_station}"].compact.join(' ')
      details += " ref->#{new_ref}" if new_ref
      details += " delete_twin=#{twin.id}" if twin

      if apply
        StationStream.transaction do
          station_id = station_id_for(row)
          twin&.destroy!
          stream.update!(
            station_id: station_id,
            external_ref: new_ref || stream.external_ref,
          )
        end
      end

      report(stream, date, action, details)
    end

    # [new ref, empty twin to delete, action] for an UNMATCHED stream whose
    # match is one ref; a plain link otherwise.
    def rekey_plan(stream, candidates)
      refs = candidates.map(&:external_ref).uniq
      return [nil, nil, :link] unless unmatched?(stream) && refs.size == 1

      key = [refs.first, stream.stream_configuration_id]
      return [nil, nil, :link_ref_taken] if claimed_keys.include?(key)

      twin =
        StationStream.find_by(
          source_id: source_id,
          stream_configuration_id: stream.stream_configuration_id,
          external_ref: refs.first,
        )
      return [nil, nil, :link_twin_has_data] if twin && !never_measured?(twin)

      claimed_keys << key
      [refs.first, twin, twin ? :rekey_replacing_twin : :rekey]
    end

    def station_refs(candidates)
      candidates.map(&:station_external_ref).uniq
    end

    # [date, [V2 row]] when the v1 list of the day AirNowStreaming last fed the
    # stream's legacy session (or of a day around it: the importer reads
    # AirNow's "today" folder), else of the day it created the session, holds
    # exactly one AQSID at the session's point; nil otherwise.
    def legacy_session_match(stream)
      session =
        Session.by_uuid(stream.external_ref.delete_prefix(UNMATCHED_PREFIX)).first
      return unless session&.last_measurement_at

      type = stream.stream_configuration.measurement_type
      key = point_key(session.latitude, session.longitude, type)
      last_day = session.last_measurement_at.utc.to_date
      created_day = session.created_at.utc.to_date

      [last_day, last_day + 1, last_day - 1, created_day, created_day - 1]
        .uniq
        .each do |date|
          aqsids = v1_aqsids_by_point(date).fetch(key, [])
          next if aqsids.empty?
          return if aqsids.size > 1

          row =
            (site_list(date) || []).find do |r|
              r.external_ref == aqsids.first && r.measurement_type == type
            end
          return row && [date, [row]]
        end
      nil
    end

    # AQSIDs by [point of their first row, rounded to 3; measurement type], the
    # way AirNowStreaming::DataParser keys them.
    def v1_aqsids_by_point(date)
      v1_site_lists[date] ||=
        begin
          data =
            cached("monitoring_site_locations_#{date.iso8601}.dat") do
              api_client.fetch_v1_locations_on(date: date)
            end
          points = {}
          types = Hash.new { |h, aqsid| h[aqsid] = Set.new }
          Epa.sanitize_data(data).each_line do |line|
            fields = line.split('|')
            aqsid = fields[V1_FIELD_AQSID]
            points[aqsid] ||= [
              fields[V1_FIELD_LATITUDE].to_f.round(3),
              fields[V1_FIELD_LONGITUDE].to_f.round(3),
            ]
            types[aqsid] << Epa.normalized_measurement_type(fields[V1_FIELD_PARAMETER_NAME])
          end
          points.each_with_object(Hash.new { |h, k| h[k] = [] }) do |(aqsid, point), index|
            types[aqsid].compact.each { |type| index[[*point, type]] << aqsid }
          end
        rescue ::ApiClient::RequestError => e
          log("#{date}: no v1 site list (#{e.message})")
          {}
        end
    end

    def never_measured?(stream)
      stream.last_measured_at.nil? && !stream.station_measurements.exists? &&
        !stream.station_stream_daily_averages.exists?
    end

    def station_id_for(row)
      station_ids[row.station_external_ref] ||=
        stations_upserter.call(rows: [row], source_name: :epa).first.station_id
    end

    def site_list(date)
      return site_lists[date] if site_lists.key?(date)

      site_lists[date] =
        begin
          data =
            cached("Monitoring_Site_Locations_V2_#{date.iso8601}.dat") do
              api_client.fetch_locations_on(date: date)
            end
          data_parser.call(data: data)
        rescue ::ApiClient::RequestError => e
          log("#{date}: no site list (#{e.message})")
          nil
        end
    end

    def cached(file_name)
      return yield unless cache_dir

      path = cache_dir.join(file_name)
      return path.binread if path.exist?

      yield.tap do |data|
        FileUtils.mkdir_p(cache_dir)
        path.binwrite(data)
      end
    end

    def unmatched?(stream)
      stream.external_ref.start_with?(UNMATCHED_PREFIX)
    end

    def point_key(latitude, longitude, measurement_type)
      [latitude.to_f.round(3), longitude.to_f.round(3), measurement_type]
    end

    def report(stream, date, action, details = nil)
      counts[action] += 1
      log(
        [
          "stream=#{stream.id}",
          "ref=#{stream.external_ref}",
          "type=#{stream.stream_configuration.measurement_type}",
          "date=#{date || '-'}",
          action,
          details,
        ].compact.join(' '),
      )
    end

    def log(message)
      logger.info("[EpaStationlessStreamsLinker] #{message}")
    end
  end
end
