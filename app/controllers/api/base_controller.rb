module Api
  class BaseController < ApplicationController
    include AirCasting::DeepSymbolize

    respond_to :json

    skip_before_action :verify_authenticity_token

    # TokenAuthenticatable was removed from Devise in 3.1
    # https://gist.github.com/josevalim/fb706b1e933ef01e4fb6
    #
    # The token travels in the `Authorization` header, not in the query string
    # or the body: HTTP Basic with the token as the username and a literal `X`
    # as the password. Every shipped iOS and Android build, and the AB3 and
    # Mini V1 firmware, send it this way.
    def authenticate_user_from_token!
      return unless request.authorization =~ /^Basic (.*)/m
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

    private

    def authenticate_user_from_bearer_token
      return if current_user
      return if bearer_token.blank?

      user = User.find_by(authentication_token: bearer_token)
      sign_in user, store: false if user
    end

    def bearer_token
      return @bearer_token if defined?(@bearer_token)

      auth = request.authorization
      @bearer_token =
        auth&.start_with?('Bearer ') ? auth.delete_prefix('Bearer ').strip : nil
    end
  end
end
