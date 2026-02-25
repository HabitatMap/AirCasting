module GovernmentSources
  class MeasurementsUpserter
    def initialize(repository: Repository.new)
      @repository = repository
    end

    def call(measurements_data:)
      return if measurements_data.empty?

      records = build_records(measurements_data)
      repository.upsert_station_measurements(records: records)
    end

    private

    attr_reader :repository

    def build_records(measurements_data)
      now = Time.current

      measurements_data.map do |m|
        {
          station_stream_id: m[:station_stream_id],
          measured_at: m[:measured_at],
          value: m[:value],
          created_at: now,
          updated_at: now,
        }
      end
    end
  end
end
