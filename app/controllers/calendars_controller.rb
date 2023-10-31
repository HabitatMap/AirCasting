class CalendarsController < ApplicationController
  include ApplicationHelper

  def index
    render layout: 'calendar'
  end
end
