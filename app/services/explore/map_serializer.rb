module Explore
  # Only what the map draws: a pin with its card, or a cluster. `value` is
  # present only when exactly one measurement type is selected, rounded to a
  # whole number as the web map shows it. Timestamps are real UTC instants in
  # epoch milliseconds, like the rest of the v3 mobile API.
  class MapSerializer
    def call(markers)
      {
        items:
          markers.map do |marker|
            marker.is_a?(Cluster) ? cluster(marker) : item(marker)
          end,
      }
    end

    private

    def item(item)
      with_value(
        {
          type: 'station',
          uuid: item.uuid,
          source: item.source,
          title: item.title,
          provider: item.provider,
          latitude: item.latitude,
          longitude: item.longitude,
          last_measured_at: item.last_measured_at.to_i * 1_000,
          measurement_types: item.streams.map(&:parameter).uniq,
        },
        item.value,
      )
    end

    def cluster(cluster)
      with_value(
        {
          type: 'cluster',
          latitude: cluster.latitude,
          longitude: cluster.longitude,
          count: cluster.count,
        },
        cluster.value,
      )
    end

    def with_value(json, value)
      value.nil? ? json : json.merge(value: value.round)
    end
  end
end
