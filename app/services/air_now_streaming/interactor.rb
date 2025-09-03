module AirNowStreaming
  class Interactor
    def initialize(
      data_importer: DataImporter.new,
      data_parser: DataParser.new,
      streams_matcher: StreamsMatcher.new,
      streams_updater: StreamsUpdater.new,
      streams_creator: StreamsCreator.new
    )
      @data_importer = data_importer
      @data_parser = data_parser
      @streams_matcher = streams_matcher
      @streams_updater = streams_updater
      @streams_creator = streams_creator
    end

    def call
      locations_data, measurements_data = data_importer.call
      parsed_measurements =
        data_parser.call(
          locations_data: locations_data,
          measurements_data: measurements_data,
        )

      matched_measurements, unmatched_measurements =
        streams_matcher.call(parsed_measurements: parsed_measurements)

      ActiveRecord::Base.transaction do
        streams_updater.call(measurements_to_create: matched_measurements)
        streams_creator.call(sessions_data: unmatched_measurements)
      end
    end

    private

    attr_reader :data_importer,
                :data_parser,
                :streams_matcher,
                :streams_updater,
                :streams_creator
  end
end
