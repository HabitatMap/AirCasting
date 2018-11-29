class Outliers::SelectBoundingBox
  def initialize(threshold)
    @threshold = threshold
  end

  def call(number_of_measurements, bounding_boxes)
    if above_threshold?(number_of_measurements, bounding_boxes)
      bounding_boxes.fetch(:with_outliers)
    else
      bounding_boxes.fetch(:without_outliers)
    end
  end

  private

  def above_threshold?(number_of_measurements, bounding_boxes)
    number_of_outliers = bounding_boxes.fetch(:number_of_outliers).to_f
    number_of_outliers / number_of_measurements.to_f > @threshold
  end
end
