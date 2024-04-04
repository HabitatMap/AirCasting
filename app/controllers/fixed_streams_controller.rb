class FixedStreamsController < ApplicationController
  include ApplicationHelper

  def show
    if Flipper.enabled?(:calendar)
      render layout: 'fixed_stream'
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
