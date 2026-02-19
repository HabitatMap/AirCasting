module Epa
  class RawMeasurementsExtractor
    FIELD_DATE = 0
    FIELD_TIME = 1
    FIELD_AQSID = 2
    FIELD_SITENAME = 3
    FIELD_GMT_OFFSET = 4
    FIELD_PARAMETER_NAME = 5
    FIELD_REPORTING_UNITS = 6
    FIELD_VALUE = 7
    FIELD_DATA_SOURCE = 8

    SUPPORTED_PARAMETERS = %w[PM2.5 O3 NO2 OZONE].freeze

    def initialize(
      api_client: ApiClient.new,
      repository: Repository.new,
      transform_worker: Epa::TransformWorker
    )
      @api_client = api_client
      @repository = repository
      @transform_worker = transform_worker
    end

    def call(batch_id:)
      batch = repository.find_ingest_batch!(batch_id: batch_id)
      response = api_client.fetch_hourly_data(measured_at: batch.measured_at)
      records = parse_lines(response, batch_id)

      ActiveRecord::Base.connection.transaction do
        repository.insert_raw_measurements!(records: records)
        repository.update_ingest_batch_status!(batch: batch, status: :extracted)
      end

      transform_worker.perform_async(batch_id)
    end

    private

    attr_reader :api_client, :repository, :transform_worker

    def parse_lines(data, batch_id)
      return [] if data.blank?

      data.split("\n").map { |line| parse_line(line, batch_id) }.compact
    end

    def parse_line(line, batch_id)
      fields = line.split('|').map(&:strip)
      return nil if fields.length < 9
      return nil unless supported_parameter?(fields[FIELD_PARAMETER_NAME])

      {
        valid_date: fields[FIELD_DATE],
        valid_time: fields[FIELD_TIME],
        aqsid: fields[FIELD_AQSID],
        sitename: Epa.sanitize_data(fields[FIELD_SITENAME]),
        gmt_offset: fields[FIELD_GMT_OFFSET],
        parameter_name: fields[FIELD_PARAMETER_NAME],
        reporting_units: fields[FIELD_REPORTING_UNITS],
        value: fields[FIELD_VALUE],
        data_source: fields[FIELD_DATA_SOURCE],
        epa_ingest_batch_id: batch_id,
      }
    end

    def supported_parameter?(parameter_name)
      SUPPORTED_PARAMETERS.include?(parameter_name)
    end
  end
end
