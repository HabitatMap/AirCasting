module Eea
  SamplingPoint =
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
    )
end
