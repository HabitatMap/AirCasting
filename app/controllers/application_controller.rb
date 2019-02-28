# AirCasting - Share your Air!
# Copyright (C) 2011-2012 HabitatMap, Inc.
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Affero General Public License for more details.
#
# You should have received a copy of the GNU Affero General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.
#
# You can contact the authors by email at <info@habitatmap.org>

class NotFound < StandardError; end
class NotAcceptable < StandardError; end

class ApplicationController < ActionController::Base
  helper Webpacker::Helper

  protect_from_forgery with: :null_session

  before_action :configure_permitted_parameters, if: :devise_controller?

  [
    [NotFound, "404 Not Found", :not_found],
    [NotAcceptable, "406 Not Acceptable", :not_acceptable]
  ].each do |clazz, text, status|
    rescue_from clazz do |exception|
      respond_to do |format|
        format.any { render :text => text, :status => status }
      end
    end
  end

  def authenticate_admin_user!
    redirect_to(new_user_session_path) && return unless current_user
    redirect_to(new_user_session_path) && return unless current_user.admin?
  end

  protected

  def configure_permitted_parameters
    added_attrs = [:login, :authentication_token, :email, :password, :password_confirmation, :remember_me]
    devise_parameter_sanitizer.for(:sign_in) { |u| u.permit(*added_attrs) }
    devise_parameter_sanitizer.for(:sign_up) { |u| u.permit(*added_attrs) }
    devise_parameter_sanitizer.for(:account_update) { |u| u.permit(*added_attrs) }
  end
end
