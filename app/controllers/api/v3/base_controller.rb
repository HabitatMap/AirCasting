module Api
  module V3
    # Shared error vocabulary for the v3 API.
    #
    # Endpoints answer errors in one shape:
    #
    #   { "error_code": "validation_error", "message": "...", "fields": { ... } }
    #
    # `error_code` is the machine-readable key, `message` is human text a client
    # should never parse, and `fields` appears only when the request *shape* is
    # wrong. The HTTP status carries the same meaning, so a client can react
    # correctly without reading the body at all.
    #
    # Two endpoints deliberately opt out and keep the raw response they shipped
    # with — `POST /api/realtime/measurements` and `GET /api/realtime/sync_measurements`.
    # AirBeams post to those directly and their firmware cannot be inspected.
    class BaseController < Api::BaseController
      STATUS_BY_ERROR_CODE = {
        'validation_error' => :bad_request,
        'unsupported_sensor_type' => :bad_request,
        'unauthorized' => :unauthorized,
        'not_found' => :not_found,
        'session_not_found' => :not_found,
        'session_uuid_taken' => :conflict,
        'internal_error' => :internal_server_error,
      }.freeze

      DEFAULT_ERROR_STATUS = :bad_request

      private

      # A dry-validation failure: the payload itself is malformed.
      def render_validation_error(errors, message: 'Request body is invalid', status: :bad_request)
        render json: {
          error_code: ErrorCodes::VALIDATION_ERROR,
          message: message,
          fields: errors.respond_to?(:to_h) ? errors.to_h : errors,
        }, status: status
      end

      # `status: nil` means "derive it from the error code" — the usual case.
      def render_error(error_code, message, status: nil)
        render json: { error_code: error_code, message: message },
               status: status || STATUS_BY_ERROR_CODE.fetch(error_code, DEFAULT_ERROR_STATUS)
      end

      # A Failure from a service. Services that already speak the vocabulary pass
      # their own `error_code`; the rest carry raw contract errors, which are a
      # validation failure by definition.
      #
      # Pass `status:` only to pin the response code regardless of the error code.
      # Endpoints that hardware already talks to use it so the shared mapping
      # cannot change what live firmware sees.
      def render_failure(result, message: 'Request body is invalid', status: nil)
        errors = result.errors

        if errors.is_a?(Hash) && errors[:error_code].present?
          render_error(errors[:error_code], errors[:message], status: status)
        else
          render_validation_error(errors, message: message, status: status || :bad_request)
        end
      end
    end
  end
end
