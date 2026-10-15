module Explore
  # One point on the explore map — an AirBeam session or a government station —
  # in the shape both sources are normalised to before clustering.
  Item =
    Struct.new(
      :source,
      :uuid,
      :title,
      :provider,
      :latitude,
      :longitude,
      :last_measured_at,
      :streams,
      keyword_init: true,
    ) do
      # Streams in catalogue order; the item reported when its newest stream did.
      def self.with_streams(streams:, **attributes)
        sorted = streams.sort_by { |s| Parameters::KEYS.index(s.parameter) }

        new(
          **attributes,
          streams: sorted,
          last_measured_at: sorted.map(&:last_measured_at).compact.max,
        )
      end
    end
end
