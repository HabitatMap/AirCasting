require_dependency 'aircasting/username_param'
require_dependency 'elastic/filter_range'

module Elastic
  class AverageInfo
    include Elastic::FilterRange

    Y_SIZES = (1..300).map { |i| 1.2 ** i * 0.000001 }

    attr_reader :data

    def initialize(data)
      @data = data
    end

    def as_json(options=nil)
      averages
    end

    private

    def averages
      @averages ||= measurements.map do |measurement|
        {
          :value => measurement[:avg].to_f,
          :west  =>  measurement[:middle_x].to_f * grid_x - grid_x / 2,
          :east  =>  measurement[:middle_x].to_f * grid_x + grid_x / 2,
          :south  =>  measurement[:middle_y].to_f * grid_y - grid_y / 2,
          :north  =>  measurement[:middle_y].to_f * grid_y + grid_y / 2
        }
      end
    end

    def measurements
      result = []

      aggregations['middle_x']['buckets'].each do |bucket_x|
        middle_x = bucket_x['key']
        bucket_x['middle_y']['buckets'].each do |bucket_y|
          middle_y = bucket_y['key']
          avg = bucket_y['avg_value']['value']

          result << { avg: avg, middle_x: middle_x, middle_y: middle_y }
        end
      end

      result
    end

    def aggregations
      filters = []

      filters << { "terms" => { "stream_id" => stream_ids } }

      filters << range('day_of_year', data[:day_from], data[:day_to])
      filters << range('year', data[:year_from], data[:year_to])
      filters << range('minutes_of_day', data[:time_from], data[:time_to])

      query = {
        "query" => {
          "filtered" => {
            "filter" => {
              "and" => {
                "filters" => filters.compact
              }
            }
          }
        },
        "_source" => false,
        "size" => 100,
        "aggs" => {
          "middle_x" => {
            "terms" => {
              "size" => 100,
              "script" => "round(doc['longitude'].value / #{grid_x})"
            },
            "aggs" => {
              "middle_y" => {
                "terms" => {
                  "size" => 100,
                  "script" => "round(doc['latitude'].value / #{grid_y})"
                },
                "aggs" => {
                  "avg_value" => {
                    "avg" => {
                      "field" => "value"
                    }
                  }
                }
              }
            }
          }
        }
      }
      index_name = "#{data[:measurement_type].parameterize.underscore}_#{data[:sensor_name].parameterize.underscore}"

      Elastic::Measurement.search(query, index: index_name).response['aggregations']
    end


    def stream_ids
      @stream_ids ||= streams.pluck(:id)
    end

    def streams
      @streams ||= Stream.
        belong_to_mobile_sessions.
        only_contributed.
        with_measurement_type(data[:measurement_type]).
        with_sensor(data[:sensor_name]).
        with_unit_symbol(data[:unit_symbol]).
        in_rectangle(data).
        with_usernames(usernames).
        with_tags(tags)
    end

    def usernames
      @username ||= AirCasting::UsernameParam.split(data[:usernames])
    end

    def grid_x
      @grid_x ||= if data[:west] < data[:east]
         (data[:east] - data[:west]) / data[:grid_size_x]
      else
        @grid_x = (180 - data[:west] + 180 + data[:east]) / data[:grid_size_x]
      end
    end

    def grid_y
      @grid_y ||= Y_SIZES.find { |x| x > (data[:north] - data[:south]) / data[:grid_size_y] }
    end

    def tags
      @tags ||= data[:tags].to_s.split(/[\s,]/)
    end
  end
end
