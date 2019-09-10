class HomeController < ApplicationController
  def index
    redirect_to 'https://habitatmap.org', status: 301
  end
end
