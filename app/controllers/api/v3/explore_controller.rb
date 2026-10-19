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
    end
  end
end
