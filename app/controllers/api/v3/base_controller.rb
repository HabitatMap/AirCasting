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
    # Inside `fields`, every leaf is a list of objects rather than of strings:
    #
    #   "fields": { "streams": { "0": { "sensor_name": [
    #     { "code": "blank", "message": "must be filled" }
    #   ] } } }
    #
    # The mobile apps ship in several languages and this API is not localised,
    # so `code` is what they switch on to pick their own sentence. See
    # `ValidationErrorsSerializer` for the vocabulary.
    #
    # Two endpoints deliberately opt out and keep the raw response they shipped
    # with — `POST /api/realtime/measurements` and `GET /api/realtime/sync_measurements`.
    # AirBeam 3 and AirBeam Mini V1 post to those directly; both close the
    # connection without reading the body, so the shape is frozen by habit
    # rather than by need.
    class BaseController < Api::BaseController
      STATUS_BY_ERROR_CODE = {
        'validation_error' => :bad_request,
        'unsupported_sensor_type' => :bad_request,
        'unauthorized' => :unauthorized,
        'not_found' => :not_found,
        'session_not_found' => :not_found,
        'note_not_found' => :not_found,
        'session_uuid_taken' => :conflict,
        'payload_too_large' => :payload_too_large,
        'try_again_later' => :service_unavailable,
        'internal_error' => :internal_server_error,
      }.freeze

      DEFAULT_ERROR_STATUS = :bad_request

      # Longer than the longest lock_timeout the services wait on (3s in the
      # creators, 1s in the ingesters), so a client that honours it comes back
      # after the rival transaction has ended either way.
      RETRY_AFTER_SECONDS = 5

      private

      def require_authentication!
        return if current_user

        render_error(ErrorCodes::UNAUTHORIZED, 'Unauthorized')
      end

      # A dry-validation failure: the payload itself is malformed.
      def render_validation_error(errors, message: 'Request body is invalid', status: :bad_request)
        render json: {
          error_code: ErrorCodes::VALIDATION_ERROR,
          message: message,
          fields: ValidationErrorsSerializer.call(errors),
        }, status: status
      end

      # `status: nil` means "derive it from the error code" — the usual case.
      def render_error(error_code, message, status: nil)
        response.set_header('Retry-After', RETRY_AFTER_SECONDS.to_s) if error_code == ErrorCodes::TRY_AGAIN_LATER

        render json: { error_code: error_code, message: message },
               status: status || STATUS_BY_ERROR_CODE.fetch(error_code, DEFAULT_ERROR_STATUS)
      end

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
