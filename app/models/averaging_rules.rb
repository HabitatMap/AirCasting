class AveragingRules
  def initialize(rules)
    @rules = rules
  end

  def self.add(threshold:, window:)
    self.new([[threshold, window]])
  end

  def add(threshold:, window:)
    self.class.new(@rules + [[threshold, window]])
  end

  def window_size(total:)
    @rules
      .filter { |threshold, _| total > threshold }
      .max { |(t1, _), (t2, _)| t1 <=> t2 }
      &.second
  end

  def first_threshold
    @rules.min { |(t1, _), (t2, _)| t1 <=> t2 }.first
  end
end
