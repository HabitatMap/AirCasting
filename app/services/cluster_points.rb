class ClusterPoints
  def initialize(points, radius)
    @points = points
    @radius = radius
    @clusters = []
  end

  def perform_clustering
    @points.each do |point|
      cluster = find_nearest_cluster(point)
      if cluster && within_radius?(cluster, point)
        cluster.add_point(point)
      else
        create_new_cluster(point)
      end
    end
    @clusters
  end

  private

  def find_nearest_cluster(point)
    @clusters.min_by { |cluster| distance(cluster, point) }
  end

  def within_radius?(cluster, point)
    distance(cluster, point) <= @radius
  end

  def distance(cluster, point)
    haversine_distance(cluster.latitude, cluster.longitude, point[:latitude], point[:longitude])
  end

  def create_new_cluster(point)
    cluster = Cluster.new(point[:latitude], point[:longitude])
    cluster.add_point(point)
    @clusters << cluster
  end

  def haversine_distance(lat1, lon1, lat2, lon2)
    earth_radius = 6371 # in kilometers

    dlat = to_radians(lat2 - lat1)
    dlon = to_radians(lon2 - lon1)

    a = Math.sin(dlat / 2) ** 2 +
        Math.cos(to_radians(lat1)) * Math.cos(to_radians(lat2)) * Math.sin(dlon / 2) ** 2

    c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    earth_radius * c
  end

  def to_radians(degrees)
    degrees * Math::PI / 180
  end
end
