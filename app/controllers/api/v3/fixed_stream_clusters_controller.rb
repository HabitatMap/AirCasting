module Api
  module V3
    class FixedStreamClustersController < BaseController
      def index
        query = decoded_query
        return render_unreadable_query unless query

        result =
          ::Timelapse::ClustersCreator.new.call(
            contract: Api::FixedSessionsContract.new.call(query),
          )

        if result.success?
          render json: result.value, status: :ok
        else
          render_failure(result, message: 'Query parameters are invalid')
        end
      end

      private

      # `q` is a URL-encoded JSON blob, so three things can go wrong before any
      # contract gets to look at it: no `q` at all, `q` that is not JSON (or is
      # JSON but not an object), and `time_from`/`time_to` that are not epoch
      # seconds. All three used to raise and answer 500 — a server error for
      # what is plainly a bad request. Everything past this point is the
      # contract's business.
      def decoded_query
        query = ActiveSupport::JSON.decode(params.to_unsafe_hash[:q].to_s)
        return nil unless query.is_a?(Hash)

        query = query.symbolize_keys
        query[:time_from] = Time.strptime(query[:time_from].to_s, '%s')
        query[:time_to] = Time.strptime(query[:time_to].to_s, '%s')
        query
      rescue JSON::ParserError, ArgumentError, TypeError
        nil
      end

      # Built by hand rather than through `ValidationErrorsSerializer`: the
      # failure happens before a contract exists, so there is no error object
      # to serialize. The shape is the one every other endpoint answers.
      def render_unreadable_query
        render json: {
          error_code: ErrorCodes::VALIDATION_ERROR,
          message: 'Query parameters are invalid',
          fields: {
            q: [
              {
                code: 'invalid_format',
                message: 'must be JSON carrying time_from and time_to as epoch seconds',
              },
            ],
          },
        }, status: :bad_request
      end
    end
  end
end
