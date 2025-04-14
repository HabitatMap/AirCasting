module Api
  class MobileRegionsController < BaseController
    FLOAT_Q_ATTRS = %i[north south east west]
    INT_Q_ATTRS = %i[time_from time_to grid_size_x grid_size_y]

    def show
      data = params.to_unsafe_hash
      data[:stream_ids] ||= []

      FLOAT_Q_ATTRS.each { |key| data[key] = data[key].to_f if data.key?(key) }
      INT_Q_ATTRS.each { |key| data[key] = data[key].to_i if data.key?(key) }

      data[:time_from] = data[:time_from] || Time.new(2_010).to_i
      data[:time_to] = data[:time_to] || Time.new(2_100).end_of_year.to_i

      respond_with MobileRegionInfo.new(data)
    end
  end
end
