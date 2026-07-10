class NotFound < StandardError
end
class NotAcceptable < StandardError
end

class ApplicationController < ActionController::Base
  respond_to :html, :json

  protect_from_forgery with: :null_session

  before_action :configure_permitted_parameters, if: :devise_controller?

  helper_method :consent_required?

  # Whether this request needs a prior-consent (opt-in) cookie banner, based on
  # the visitor's country. Memoized per request. See GeoConsent.
  def consent_required?
    return @consent_required if defined?(@consent_required)

    @consent_required = GeoConsent.consent_required?(request.remote_ip)
  end

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

  def configure_permitted_parameters
    attrs = %i[
      login
      authentication_token
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
