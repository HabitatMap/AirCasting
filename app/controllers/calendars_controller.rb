class CalendarsController < ApplicationController
  include ApplicationHelper

  def index
    if Flipper.enabled?(:calendar)
      render layout: 'calendar'
    else
      render_not_found
    end
  end
end
