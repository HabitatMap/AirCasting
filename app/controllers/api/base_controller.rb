module Api
  class BaseController < ApplicationController
    include AirCasting::DeepSymbolize

    respond_to :json

    skip_before_action :verify_authenticity_token

    # TokenAuthenticatable was removed from Devise in 3.1
    # https://gist.github.com/josevalim/fb706b1e933ef01e4fb6
    #
    # For this example, we are simply using token authentication
    # via parameters. However, anyone could use Rails's token
    # authentication features to get the token from a header.
    def authenticate_user_from_token!
      return if Rails.env.test?

      request.authorization =~ /^Basic (.*)/m
      user_token, _password = Base64.decode64($1).split(/:/, 2) # mobile app sends token + "X" as password

      user = user_token && User.find_by_authentication_token(user_token.to_s)

      if user
        # Notice we are passing store false, so the user is not
        # actually stored in the session and a token is needed
        # for every request. If you want the token to work as a
        # sign in token, you can simply remove store: false.
        sign_in user, store: false
      end
    end

    protected

    def photo_location(note)
      if note.s3_photo.attached?
        Rails.application.routes.url_helpers.rails_representation_url(
          note.s3_photo.variant(resize_to_limit: [600, 600]).processed,
          host: A9n.host_,
        )
      elsif note.photo_exists?
        'http://' + request.host + ':' + request.port.to_s +
          note.photo.url(:medium)
      end
    end
  end
end
