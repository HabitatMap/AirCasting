class NotFound < StandardError
end
class NotAcceptable < StandardError
end

class ApplicationController < ActionController::Base
  # `:json` is not decorative: POST /users/password.json is the forgot-password
  # endpoint the mobile apps call, and dropping it here makes that route raise
  # ActionController::UnknownFormat. See spec/requests/password_reset_spec.rb.
  respond_to :html, :json

  protect_from_forgery with: :null_session

  # Devise screens render through layouts/auth, which is the only place the
  # `auth` stylesheet is loaded. Every other controller keeps the default
  # `application` layout, and the ones that name a layout explicitly
  # (client_app, maps) are unaffected.
  layout :layout_for_request

  before_action :configure_permitted_parameters, if: :devise_controller?

  [
    [NotFound, '404 Not Found', :not_found],
    [NotAcceptable, '406 Not Acceptable', :not_acceptable],
  ].each do |clazz, text, status|
    rescue_from clazz do |exception|
      respond_to { |format| format.any { render plain: text, status: status } }
    end
  end

  def authenticate_admin_user!
    redirect_to(new_user_session_path) && return unless current_user
    redirect_to(new_user_session_path) && return unless current_user.admin?
  end

  protected

  def layout_for_request
    devise_controller? ? "auth" : "application"
  end

  # Deliberately *not* `authentication_token`. It is a bearer credential, not a
  # profile field: `Api::BaseController` accepts it as the HTTP Basic username
  # and as a bearer token, and the AirBeam firmware sends it on every upload
  # with no way to refresh it short of re-pairing the device over BLE. Letting
  # a form body write it meant a user could silently stop every one of their
  # own devices uploading — and, because a blank token is not NULL, could save
  # an empty one that any unauthenticated request then matched.
  #
  # No client or view has ever posted it. `:sign_in` does not need it either;
  # `User.find_for_database_authentication` keys off `login`.
  def configure_permitted_parameters
    attrs = %i[
      login
      email
      password
      password_confirmation
      remember_me
      username
    ]
    devise_parameter_sanitizer.permit(:sign_in, keys: attrs)
    devise_parameter_sanitizer.permit(:sign_up, keys: attrs)
    devise_parameter_sanitizer.permit(:account_update, keys: attrs)
  end
end
