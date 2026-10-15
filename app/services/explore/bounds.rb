module Explore
  # The visible map rectangle. A view across the antimeridian arrives with
  # west > east and is queried as two boxes, one on each side of it.
  class Bounds
    attr_reader :west, :east, :south, :north

    def initialize(west:, east:, south:, north:)
      @west = Float(west)
      @east = Float(east)
      @south = Float(south)
      @north = Float(north)
    end

    def crosses_antimeridian?
      west > east
    end

    # [west, south, east, north] per box.
    def boxes
      if crosses_antimeridian?
        [[west, south, 180.0, north], [-180.0, south, east, north]]
      else
        [[west, south, east, north]]
      end
    end

    # `&&` against an envelope is what lets the planner use a GiST index on
    # `column`; ST_X/ST_Y BETWEEN cannot.
    def envelope_condition(column)
      clause =
        boxes
          .map { "#{column} && ST_MakeEnvelope(?, ?, ?, ?, 4326)" }
          .join(' OR ')

      ["(#{clause})", *boxes.flatten]
    end

    def between_condition(latitude_column, longitude_column)
      clause =
        boxes
          .map do
            "(#{latitude_column} BETWEEN ? AND ? AND #{longitude_column} BETWEEN ? AND ?)"
          end
          .join(' OR ')
      values = boxes.flat_map { |w, s, e, n| [s, n, w, e] }

      ["(#{clause})", *values]
    end
  end
end
