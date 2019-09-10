class StaticPagesController < ApplicationController
  def about
    redirect_to 'https://habitatmap.org/about', status: 301
  end
  def donate
    redirect_to 'https://habitatmap.org/donate', status: 301
  end
end
