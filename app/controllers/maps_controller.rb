class MapsController < ApplicationController
  include ApplicationHelper

  def index
    render layout: 'map'
  end
end
