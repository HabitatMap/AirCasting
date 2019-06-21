require_dependency 'average_info'

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
      data = prepareData(params)

      data[:time_from] = data[:time_from] || 0
      data[:time_to] = data[:time_to] || 2_359

      data[:day_from] = data[:day_from] || 0
      data[:day_to] = data[:day_to] || 365

      data[:year_from] = data[:year_from] || 2_010
      data[:year_to] = data[:year_to] || 2_050

      data[:session_ids] ||= []

      respond_with AverageInfo.new(data)
    end

    def index2
      data = prepareData(params)

      data[:time_from] = data[:time_from] || Time.new(2_010).to_i
      data[:time_to] = data[:time_to] || Time.new(2_100).end_of_year.to_i

      data[:session_ids] ||= []

      respond_with AverageInfo.new(data)
    end

    private

    def prepareData(params)
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
