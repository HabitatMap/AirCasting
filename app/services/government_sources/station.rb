module GovernmentSources
  # One stream as a source's site list describes it. Despite the name this is a
  # stream (one pollutant at one site), not a `::Station` row; the `station_*`
  # fields describe the site it belongs to.
  Station =
    Struct.new(
      :external_ref,
      :measurement_type,
      :latitude,
      :longitude,
      :location,
      :time_zone,
      :title,
      :url_token,
      :source_id,
      :stream_configuration_id,
      # The site's id in the source (EPA FullAQSID), which becomes
      # `stations.external_ref`. Nil for paths that do not group yet.
      :station_external_ref,
      # One of ::Station::EXCLUDED_REASONS, or nil.
      :excluded_reason,
      :station_id,
      keyword_init: true,
    ) do
      def valid?
        external_ref.present? && latitude.present? && longitude.present?
      end
    end
end
