class ShortenedUrlsController < ApplicationController
  def show
    record = ShortenedUrl.find_by!(slug: params[:slug])
    ShortenedUrl.where(id: record.id).update_all('click_count = click_count + 1')
    # Prevent browsers from caching the 301 so repeat clicks still reach us and
    # are counted (same approach Bitly uses to keep a 301 trackable).
    expires_now
    redirect_to record.long_url, allow_other_host: true, status: :moved_permanently
  rescue ActiveRecord::RecordNotFound
    redirect_to root_path, status: :found
  end
end
