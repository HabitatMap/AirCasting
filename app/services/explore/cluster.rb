module Explore
  # Two or more items sharing a grid cell, as minimal as a timelapse cluster.
  # `value` is the mean of its members' values — set only when exactly one
  # measurement type is selected, as the members' values are then.
  Cluster =
    Struct.new(
      :latitude,
      :longitude,
      :count,
      :value,
      keyword_init: true,
    )
end
