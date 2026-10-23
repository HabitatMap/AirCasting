module Api
  module V3
    # Every v3 endpoint answers the shared error envelope — see
    # `Api::ErrorRendering` for its shape and `Api::ErrorCodes` for the codes.
    #
    # Two endpoints deliberately opt out and keep the raw response they shipped
    # with — `POST /api/realtime/measurements` and `GET /api/realtime/sync_measurements`.
    # AirBeam 3 and AirBeam Mini V1 post to those directly; both close the
    # connection without reading the body, so the shape is frozen by habit
    # rather than by need.
    class BaseController < Api::BaseController
      include Api::ErrorRendering

      private

      def require_authentication!
        return if current_user

        render_error(ErrorCodes::UNAUTHORIZED, 'Unauthorized')
      end
    end
  end
end
