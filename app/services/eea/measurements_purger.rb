module Eea
  class MeasurementsPurger
    CUTOFF = 7.days

    def initialize(repository: Repository.new)
      @repository = repository
    end

    def call
      cutoff = CUTOFF.ago

      repository.purge_raw_measurements!(cutoff: cutoff)
      repository.purge_transformed_measurements!(cutoff: cutoff)
    end

    private

    attr_reader :repository
  end
end
