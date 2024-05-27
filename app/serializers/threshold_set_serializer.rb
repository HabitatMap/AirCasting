class ThresholdSetSerializer
  def call(threshold_set)
    [
      threshold_set.threshold_very_low.to_i.to_s,
      threshold_set.threshold_low.to_i.to_s,
      threshold_set.threshold_medium.to_i.to_s,
      threshold_set.threshold_high.to_i.to_s,
      threshold_set.threshold_very_high.to_i.to_s,
    ]
  end
end
