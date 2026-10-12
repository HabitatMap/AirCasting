module GovernmentSources
  class LegacyStationStreamFilter
    def initialize(repository: Repository.new)
      @repository = repository
    end

    def call(rows:, source_name:)
      return [] if rows.empty?

      existing_keys = repository.existing_fixed_stream_keys(source_name: source_name)

      rows.reject do |row|
        existing_keys.include?([row.measurement_type, row.external_ref])
      end
    end

    private

    attr_reader :repository
  end
end
