module Explore
  # One stream of a public station, named the way a client saw it on
  # GET /api/v3/explore/stations/{uuid}, and reduced to what reading its
  # measurements needs: which table the readings are in (`source`), which row
  # (`id`), and when the station last reported (`last_measured_at`), which
  # anchors the default window.
  #
  # Deliberately not Explore::StreamItemRich: that one carries a latest reading
  # and a 24-hour range, both of which cost joins this path has no use for. It
  # does carry `source`, which the rich one does not — this struct outlives the
  # query that built it and has to say which table to go back to.
  StreamItem =
    Struct.new(:source, :id, :sensor_name, :last_measured_at, keyword_init: true) do
      def airbeam? = source == AirbeamItemsQuery::SOURCE
    end
end
