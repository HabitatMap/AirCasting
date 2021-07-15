class Outliers::CalculateBoundingBoxes
  INITIAL_BOUNDING_BOX = {
    min_latitude: '+90'.to_d,
    max_latitude: '-90'.to_d,
    min_longitude: '+180'.to_d,
    max_longitude: '-180'.to_d
  }
  INITIAL_BOUNDING_BOXES = {
    number_of_outliers: 0,
    with_outliers: INITIAL_BOUNDING_BOX,
    without_outliers: INITIAL_BOUNDING_BOX
  }

  def initialize(
    max_distance,
    calculate_distance = Outliers::CalculateDistance.new
  )
    @max_distance = max_distance
    @calculate_distance = calculate_distance
  end

  def call(centroid, measurements)
    measurements.reduce(
      INITIAL_BOUNDING_BOXES
    ) do |bounding_boxes, measurement|
      lng_lat = [measurement.longitude, measurement.latitude]

      if outlier?(lng_lat, centroid)
        update_bounding_box_with_outliers(bounding_boxes, lng_lat)
      else
        update_both_bounding_boxes(bounding_boxes, lng_lat)
      end
    end
  end

  private

  def outlier?(lng_lat, centroid)
    @calculate_distance.call(lng_lat, centroid) > @max_distance
  end

  def update_bounding_box_with_outliers(bounding_boxes, lng_lat)
    bounding_boxes.merge(
      with_outliers:
        update_bounding_box(bounding_boxes.fetch(:with_outliers), lng_lat),
      number_of_outliers: bounding_boxes.fetch(:number_of_outliers) + 1
    )
  end

  def update_both_bounding_boxes(bounding_boxes, lng_lat)
    bounding_boxes.merge(
      with_outliers:
        update_bounding_box(bounding_boxes.fetch(:with_outliers), lng_lat),
      without_outliers:
        update_bounding_box(bounding_boxes.fetch(:without_outliers), lng_lat)
    )
  end

  def update_bounding_box(bounding_box, lng_lat)
    lng, lat = lng_lat

    bounding_box.merge(
      min_latitude: [lat, bounding_box.fetch(:min_latitude)].min,
      max_latitude: [lat, bounding_box.fetch(:max_latitude)].max,
      min_longitude: [lng, bounding_box.fetch(:min_longitude)].min,
      max_longitude: [lng, bounding_box.fetch(:max_longitude)].max
    )
  end
end
