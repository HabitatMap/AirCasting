class AverageStreams
  def initialize(
    rules: AveragingRules
      .add(threshold: 7_200, window: 5)
      .add(threshold: 32_400, window: 60),
    streams_find_each: StreamsFindEach.new,
    streams_repository: StreamsRepository.new,
    logger: Rails.logger
  )
    @rules = rules
    @streams_find_each = streams_find_each
    @streams_repository = streams_repository
    @logger = logger
  end

  def call
    @streams_find_each.call do |stream|
      next if average_stream(stream) == :next
      @streams_repository.calculate_average_value!(stream)
    end
  end

  private

  def average_stream(stream)
    ids = stream.measurements.order('time ASC').pluck(:id)
    window_size = @rules.window_size(total: ids.count)
    if window_size.nil?
      @logger.info(
        "Stream ##{stream.id} having #{ids.size} measurements skipped.",
      )
      return :next
    end
    @logger.info(
      "Averaging stream ##{stream.id} having #{
        ids.size
      } measurements with a window of #{window_size} size",
    )
    Stream.transaction do
      measurements_windows(ids, window_size) do |window|
        average_measurements(window)
      end
    end
  end

  # cannot use `find_each` or similar because they do not guarantee ordering
  def measurements_windows(all_ids, window)
    all_ids.each_slice(query_window_from(window)) do |ids|
      Measurement
        .where(id: ids)
        .order('time ASC')
        .each_slice(window)
        .each { |measurement| yield measurement }
    end
  end

  def average_measurements(measurements)
    middle = measurements[measurements.size / 2]
    average = measurements.map(&:value).reduce(:+) / measurements.size
    middle.update!(value: average)
    (measurements - [middle]).each(&:destroy!)
  end

  # returns number as close as 1_000 which is what `find_each` uses by default
  def query_window_from(amount)
    return amount if amount > 1_000
    query_window_from(amount * 2)
  end
end
