class ClientAppController < ApplicationController
  include ApplicationHelper

  def index
    render layout: 'client_app'
  end
end
