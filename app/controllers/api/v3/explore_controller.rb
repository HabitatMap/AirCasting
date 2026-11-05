module Api
  module V3
    # Public: the explore map shows only data its owners made public.
    class ExploreController < BaseController
      def map
        contract =
          Api::ExploreMapContract.new.call(
            params
              .permit(:west, :east, :south, :north, :zoom, :sources, :measurement_types)
              .to_h
              .symbolize_keys,
          )
        if contract.failure?
          return(
            render_validation_error(
              contract.errors,
              message: 'Query parameters are invalid',
            )
          )
        end

        query = contract.to_h
        markers =
          ::Explore::Map.new.call(
            **query.slice(:west, :east, :south, :north, :zoom),
            sources: Api::ExploreMapContract.list(query[:sources]),
            measurement_types:
              Api::ExploreMapContract.list(query[:measurement_types]),
          )

        render json: ::Explore::MapSerializer.new.call(markers), status: :ok
      end

      # One station in full, behind one marker, addressed by uuid alone. A uuid that is
      # not public, not outdoor, or not there at all answers the same 404 —
      # a private session must not be distinguishable from a missing one.
      def station
        item = ::Explore::StationQuery.new.call(uuid: params[:uuid])

        unless item
          return render_error(ErrorCodes::NOT_FOUND, 'Station not found')
        end

        render json: ::Explore::StationSerializer.new.call(item), status: :ok
      end

      # The readings behind one stream of one public station (GOV or AB), mirroring
      # GET /api/v3/fixed_sessions/{uuid}/measurements for anything the explore
      def measurements
        contract = ::Api::ExploreStationMeasurementsContract.new.call(query_params)
        return render_validation_error(contract.errors, message: 'Query is invalid') if contract.failure?

        streams = ::Explore::StationStreamsQuery.new.call(uuid: params[:uuid])
        unless streams
          return render_error(ErrorCodes::NOT_FOUND, 'Station not found')
        end

        stream = streams.find { |candidate| candidate.sensor_name == contract[:sensor_name] }
        unless stream
          return render_error(
            ErrorCodes::NOT_FOUND,
            "Station has no stream named #{contract[:sensor_name]}",
          )
        end

        points =
          ::Explore::StationMeasurementsQuery.new(
            stream: stream,
            **contract.to_h.slice(:start_time, :end_time),
          ).call

        render json: points, status: :ok
      end

      private

      def query_params
        params.to_unsafe_h.slice(:sensor_name, :start_time, :end_time)
      end
    end
  end
end
