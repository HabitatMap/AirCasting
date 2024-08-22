class Cluster
  attr_accessor :latitude, :longitude, :points, :count

  def initialize(latitude, longitude)
    @latitude = latitude
    @longitude = longitude
    @points = []
    @count = 0
  end

  def add_point(point)
    @points << point
    @count += 1
    update_cluster_center
  end

  def update_cluster_center
    return if @points.empty?

    @latitude = @points.sum { |point| point[:latitude] } / @points.size
    @latitude = @points.sum { |point| point[:latitude] } / @points.size
  end
end
