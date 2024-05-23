class ThresholdSetSerializer
  def call(threshold_set)
    [
      threshold_set.threshold_very_low.to_s,
      threshold_set.threshold_low.to_s,
      threshold_set.threshold_medium.to_s,
      threshold_set.threshold_high.to_s,
      threshold_set.threshold_very_high.to_s,
    ]
  end
end
