module GovernmentSources
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
      keyword_init: true,
    ) do
      def valid?
        external_ref.present? && latitude.present? && longitude.present?
      end
    end
end
