class CalendarsController < ApplicationController
  include ApplicationHelper

  def index
    if Flipper.enabled?(:calendar)
      render layout: 'calendar'
    else
      render_not_found
    end
  end

  private

  def render_not_found
    render file: "#{Rails.root}/public/404.html",
           layout: false,
           status: :not_found
  end
end
