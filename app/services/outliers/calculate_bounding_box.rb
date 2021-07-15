class Outliers::CalculateBoundingBox
  # Since New York is located ~ (40.6971494, -74.259869) and Pittsburgh ~ (40.4313473,-80.0505407), 5 for MAX_DISTANCE
  # the distance in between. In fact, sqrt[(40.6971494 - 40.4313473)^2 + (-74.259869 - -80.0505407)^2] ~= 5
  MAX_DISTANCE = 5

  # If detected outliers are more than 5% of the measurements calculate the bounding box including the outliers
  THRESHOLD = 0.05
  NIL_BOUNDING_BOX = {
    min_latitude: nil,
    max_latitude: nil,
    min_longitude: nil,
    max_longitude: nil
  }

  def initialize(
    calculate_centroid = Outliers::CalculateCentroid.new,
    calculate_bounding_boxes = Outliers::CalculateBoundingBoxes.new(
      MAX_DISTANCE,
      Outliers::CalculateDistance.new
    ),
    select_bounding_box = Outliers::SelectBoundingBox.new(THRESHOLD)
  )
    @calculate_centroid = calculate_centroid
    @calculate_bounding_boxes = calculate_bounding_boxes
    @select_bounding_box = select_bounding_box
  end

  def call(measurements)
    return NIL_BOUNDING_BOX unless measurements.any?

    centroid = @calculate_centroid.call(measurements)
    bounding_boxes = @calculate_bounding_boxes.call(centroid, measurements)
    @select_bounding_box.call(measurements.size, bounding_boxes)
  end
end
