module OpenAq
  Measurement =
    Struct.new(
      :sensor_name,
      :value,
      :latitude,
      :longitude,
      :time_local,
      :time_utc,
      :location,
      :city,
      :country,
      :unit,
      keyword_init: true
    ) do
      def initialize(**kwargs)
        super
        convert_ppm_to_ppb(kwargs[:value]) if kwargs[:unit] == 'ppm'
      end

      private

      def convert_ppm_to_ppb(value)
        self.unit = 'ppb'
        self.value = value * 1_000
      end
    end
end
