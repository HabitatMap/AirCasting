module Explore
  # Two or more items sharing a grid cell. `sources` counts items per source;
  # `bounds` is the extent of the members, for zooming in on a tap; `averages`
  # maps each parameter present to its mean over the items that have it.
  Cluster =
    Struct.new(
      :latitude,
      :longitude,
      :count,
      :sources,
      :bounds,
      :averages,
      keyword_init: true,
    )
end
