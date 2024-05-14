class ThresholdSerializer
  def call(thresholds)
    {
      min: thresholds[:threshold_very_low],
      low: thresholds[:threshold_low],
      middle: thresholds[:threshold_medium],
      high: thresholds[:threshold_high],
      max: thresholds[:threshold_very_high],
    }
  end
end
