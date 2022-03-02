# Optimizing AirCasting

Working on the [PurpleAir integration](https://trello.com/c/ie84HKMX/1541-ingest-display-outdoor-pm25ug-m3-purpleair-data), we realized that the current architecture is limiting performance.

Loading ~10.000 sessions takes several seconds. In fact, AirCasting performs the following:

1. BACKEND: Queries multiple MySql tables: users, sessions, streams and sometimes measurements against the filtering criteria
2. BACKEND: Loops through records to build the JSON
3. Sends tens of megabytes to the browser
4. FRONTEND: Loops through each item from the JSON to draw single session markers on the map
5. FRONTEND: Clusters single session markers that are close to each other into cluster markers

Currently, the browser needs to know about **each individual** session matching the filtering criteria to:

a. MAP: Render the single session markers with the average value
b. BOTTOM: Render all the session cards
c. BOTTOM-LEFT: Export the sessions via email (the URL includes the ids of all the sessions shown on the map to export)
d. Probably some other minor reasons

But there is no need to:

- Render tens of thousands of single markers on the map just to have them clustered later
- Render tens of thousands of session cards; nobody would scroll through all of them

It would be more performant to:

- Calculate the clusters on the backend and send aggregated information (e.g., bounding box, average value) to the frontend (instead of sending each individual session); this will probably reduce the items sent to the browser from ~10.000 to ~200.
- Render one card per cluster (not per session)

![Hex map from the Zalando blog post (see list at the bottom)](https://img01.ztat.net/engineering-blog/posts/2021/12/images/pophex_tiles.gif)

Some other ideas:

- Migrate to Postgres and Postgis (instead of MySql)
  - Implement the heatmap / crowdmap / clusters with `ST_SquareGrid` or `ST_HexagonGrid`
  - Go through a transition period where some things are in MySQL some others in Postgis (PurpleAir?)
- Use QGis to visualize things in development
- Treat latitude and longitude as coordinates in the database, not as decimal numbers.
- Restructure the database schema
  - Maybe PurpleAir measurements could be one table instead of four (sessions, streams, measurements, users)?

With the current version of Rails (thanks Tomasz for preparing the foundations to make it possible!), we could use two databases to migrate AirCasting to Postgres / Postgis incrementally. Here's some pseudo-code to keep PurpleAir measurements in Postgis:

```ruby
gem "pg", "~> 1.3"
gem "activerecord-postgis-adapter", "~> 7.1"


class CreatePurpleAirMeasurements < ActiveRecord::Migration[6.1]
  def change
    create_table :purple_air_measurements do |t|
      t.float :value
      t.st_point "point", geography: true # or geometry: true
      t.datetime "time_local"
      t.datetime "time_utc"
      t.string "location"
      t.string "city"
    end
  end
end

class PostgisApplicationRecord < ActiveRecord::Base
  self.abstract_class = true

  connects_to database: { writing: :postgis, reading: :postgis }
end

class PurpleAirMeasurement < PostgisApplicationRecord
end


PurpleAirMeasurement.new(
  # Need to choose the proper factory.
  point: RGeo::Geographic.spherical_factory.point(longitude, latitude),
  # ...
)
```

```sql
-- Cluster the extent of the measurements in purple_air_measurements
-- and return for each:
--   number of sessions
--   bounding box
--   average value
-- This query is copied from the ST_HexagonGrid docs (see list at the bottom).

SELECT COUNT(*), hexes.geom, AVG(value)
FROM
    ST_HexagonGrid(
        10000,
        ST_SetSRID(ST_EstimatedExtent('purple_air_measurements', 'point'), 3857)
    ) AS hexes
    INNER JOIN
    purple_air_measurements AS measurement
    ON ST_Intersects(measurement.point, hexes.geom)
GROUP BY hexes.geom;
```

# What the iOS app does

Marysia implemented a cool algorithm to display the heatmap on iOS:

1. User selects a single session to display
2. The route is drawn as a polyline where segments are connecting the coordinates of each subsequent measurement
3. The map is subdivided into 120 squares
4. Measurements are bucketized into each square
5. Empty squares remain transparent
6. Squares containing at least one measurement are colored depending on the average value of the contained measurements

Notice that:

- The algorithm works smoothly with ~30.000 measurements
- All the sessions are stored on the device: no need to query or fetch anything
- The algorithm is implemented to display single session (not all of them at once)
- Single squares are not interactive (i.e., they don't do anything if tapped)
- Polygons are redrawn when zooming and dragging the map

Unfortunately, this wouldn't speed up what the webapp does (see the first list in this document) because iOS does not do the same work:

1. Not needed because the data is already on the device
2. Not needed because the data is already on the device
3. Not needed because the data is already on the device
4. and 5. are pretty much done in one pass

# Interesting Reads

- [PostGIS in Action](https://www.manning.com/books/postgis-in-action-third-edition)
- [Elevation Profiles and Flightlines with PostGIS](https://blog.crunchydata.com/blog/elevation-profiles-and-flightlines-with-postgis)
- [How to divide world into cells (grid)](https://stackoverflow.com/questions/68292782/how-to-divide-world-into-cells-grid)
- [EPSG 3857 or 4326 for GoogleMaps, OpenStreetMap and Leaflet](https://gis.stackexchange.com/questions/48949/epsg-3857-or-4326-for-googlemaps-openstreetmap-and-leaflet)
- [Transform coordinates](http://epsg.io/transform)
- [Introduction to PostGIS - Geography](https://www.postgis.net/workshops/postgis-intro/geography.html)
- [Introduction to PostGIS - Geometries](https://postgis.net/workshops/postgis-intro/geometries.html)
- [PostGIS Polygon Splitting](https://blog.cleverelephant.ca/2018/06/polygon-splitting.html)
- [Zalando - Maps with PostgreSQL and PostGIS](https://engineering.zalando.com/posts/2021/12/maps-with-postgresql-and-postgis.html)
- [Hex grid algorithm for PostGIS](https://medium.com/geolytix/hex-grid-algorithm-for-postgis-4ac45f61d093)
- [PostGIS ST\_ClusterDBSCAN vs ST\_ClusterKMeans with sample](https://www.linkedin.com/pulse/postgis-stclusterdbscan-vs-stclusterkmeans-sample-rashidinezhad/)
- [Get Bounding Box of Each Polygon (Each Rows in a table) using PostGIS](https://gis.stackexchange.com/questions/304834/get-bounding-box-of-each-polygon-each-rows-in-a-table-using-postgis)
- [Generating a Grid (fishnet) of points or polygons for PostGIS](https://www.spdba.com.au/generating-a-grid-fishnet-of-points-or-polygons-for-postgis/)
- [Geo-Rails Part 7: Geometry vs. Geography, or, How I Learned To Stop Worrying And Love Projections](https://daniel-azuma.com/articles/georails/part-7)
- [Geographic coordinate system](https://en.wikipedia.org/wiki/Geographic_coordinate_system)
- [How to visualize the density of point data in a grid](https://www.stevencanplan.com/2021/02/how-to-visualize-the-density-of-point-data-in-a-grid/)
- [Using geometry or point for postgis](https://gis.stackexchange.com/questions/193829/using-geometry-or-point-for-postgis)
- [Polyline Tool](https://www.keene.edu/campus/maps/tool/)
- [Objects clustering and grouping with Django, PostGIS and Google Maps](http://the7bits.com/blog/objects-clustering-and-grouping-with-django-postgis-and-google-maps/index.html)
- [Map Clustering Algorithm](https://stackoverflow.com/questions/1434222/map-clustering-algorithm)
- [Display millions of locations very, very fast](https://gis.stackexchange.com/questions/339372/display-millions-of-locations-very-very-fast)
- [Split all OSM roads within boundingbox in 20m segments and save to new table](https://gis.stackexchange.com/questions/64898/split-all-osm-roads-within-boundingbox-in-20m-segments-and-save-to-new-table)
- [PostGIS vs. Geocoder in Rails](https://pganalyze.com/blog/postgis-rails-geocoder)
- [Creating a grid within a layer using ST\_HexagonGrid with PostGIS](https://gis.stackexchange.com/questions/403126/creating-a-grid-within-a-layer-using-st-hexagongrid-with-postgis)
- [PostgreSQL Best Practices: Spatial Aggregation Analysis](https://www.alibabacloud.com/blog/postgresql-best-practices-spatial-aggregation-analysis_597045)
- [Server side clusters of coordinates based on zoom level](https://stackoverflow.com/questions/1487704/server-side-clusters-of-coordinates-based-on-zoom-level)
- [RGeo - Which factory should I use?](https://github.com/rgeo/rgeo/blob/master/doc/Which-factory-should-I-use.md)
- [Spatial clustering with PostGIS?](https://gis.stackexchange.com/questions/11567/spatial-clustering-with-postgis)
- [ST\_HexagonGrid](https://postgis.net/docs/ST_HexagonGrid.html)
- [Waiting for PostGIS 3.1: Grid Generators](https://blog.crunchydata.com/blog/waiting-for-postgis-3.1-grid-generators)
