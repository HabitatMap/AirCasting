class AverageStreams
  def initialize(
    rules: AveragingRules
      .add(threshold: 7_200, window: 5)
      .add(threshold: 32_400, window: 60),
    logger: Rails.logger
  )
    @rules = rules
    @logger = logger
  end

  def call
    stream_ids_to_average.each do |stream_id|
      measurement_ids_and_values = fetch_data_for_averaging(stream_id)
      window_size = @rules.window_size(total: measurement_ids_and_values.size)

      Stream.transaction do
        @logger.info(
          "Averaging stream ##{stream_id} having #{measurement_ids_and_values.size} measurements with a window of #{window_size} size",
        )
        average_measurements(measurement_ids_and_values, window_size)
        update_stream(stream_id)
      end
    end
  end

  private

  def stream_ids_to_average
    Stream
      .mobile
      .where('streams.measurements_count > ?', @rules.first_threshold)
      .pluck(:id)
  end

  def fetch_data_for_averaging(stream_id)
    Measurement.where(stream_id: stream_id).order('time ASC').pluck(:id, :value)
  end

  # slice size should be divisible by all window sizes used for averaging
  # for now it is a fixed value calculated for currently used window sizes (5 and 60)
  def average_measurements(measurement_ids_and_values, window_size)
    measurement_ids_and_values.each_slice(5040) do |batch_of_ids_and_values|
      average_measurements_batch(batch_of_ids_and_values, window_size)
    end
  end

  def average_measurements_batch(batch_of_ids_and_values, window_size)
    measurements_data_for_update, ids_to_delete =
      calculate_averaged_data(batch_of_ids_and_values, window_size)

    Measurement.upsert_all(measurements_data_for_update)
    Measurement.delete(ids_to_delete)
  end

  def calculate_averaged_data(ids_and_values, window_size)
    measurements_data_for_update = []
    ids_to_delete = []

    ids_and_values.each_slice(window_size) do |slice|
      size = slice.size
      middle_id = slice[size / 2][0]
      ids_and_values_as_hash = slice.to_h
      average_value = ids_and_values_as_hash.values.sum(0.0) / size

      measurements_data_for_update << { id: middle_id, value: average_value }
      ids_to_delete += (ids_and_values_as_hash.keys - [middle_id])
    end

    [measurements_data_for_update, ids_to_delete]
  end

  def update_stream(stream_id)
    Stream.reset_counters(stream_id, :measurements)
    Stream.update(
      stream_id,
      average_value: Measurement.where(stream_id: stream_id).average(:value),
    )
  end
end
