module Api
  class AveragesController < BaseController
    FLOAT_Q_ATTRS = %i[north south east west]
    INT_Q_ATTRS = %i[
      time_from
      time_to
      day_from
      day_to
      year_from
      year_to
      grid_size_x
      grid_size_y
    ]

    def index
      data = prepare_data(params)

      data[:time_from] = data[:time_from] || 1.year.ago.to_i
      data[:time_to] = data[:time_to] || Time.new(2_100).end_of_year.to_i

      respond_with CrowdmapAverages::ForMobile.new(data).as_json
    end

    def index2
      data = prepare_data(params)

      data[:time_from] = data[:time_from] || Time.new(2_010).to_i
      data[:time_to] = data[:time_to] || Time.new(2_100).end_of_year.to_i

      data[:stream_ids] ||= []

      respond_with CrowdmapAverages::ForWeb.new(data).as_json
    end

    private

    def prepare_data(params)
      if params[:q].is_a?(String)
        data =
          ActiveSupport::JSON.decode(params.to_unsafe_hash[:q]).symbolize_keys
      else
        data = params.to_unsafe_hash[:q].symbolize_keys
      end
      FLOAT_Q_ATTRS.each { |key| data[key] = data[key].to_f if data.key?(key) }
      INT_Q_ATTRS.each { |key| data[key] = data[key].to_i if data.key?(key) }

      data
    end
  end
end
