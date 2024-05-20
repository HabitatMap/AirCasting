namespace :threshold_sets do
  task populate: :environment do
    Stream.find_each(batch_size: 100) do |stream|
      set = ThresholdSet.find_or_create_by(
        sensor_name: stream.sensor_name,
        unit_symbol: stream.unit_symbol,
        threshold_very_low: stream.threshold_very_low,
        threshold_low: stream.threshold_low,
        threshold_medium: stream.threshold_medium,
        threshold_high: stream.threshold_high,
        threshold_very_high: stream.threshold_very_high
      ) do |threshold_set|
        threshold_set.is_default = false
      end
      stream.update(threshold_set_id: set.id)
    end
  end
end
