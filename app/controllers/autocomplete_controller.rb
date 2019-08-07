class AutocompleteController < ApplicationController
  def tags
    Api::GoogleAnalytics.new.register_event('Autocomplete#tags')
    q = params[:q]
    render json: [] unless q.present?

    query =
      Session.where(contribute: true).tag_counts.where(
        ['tags.name LIKE ?', "#{q}%"]
      )
        .limit(params[:limit])
    render json: query.map(&:name)
  end

  def usernames
    Api::GoogleAnalytics.new.register_event('Autocomplete#usernames')
    q = params[:q]
    render json: [] unless q.present?

    names =
      User.select('username').where('username LIKE ?', "#{q}%").order(:username)
        .map(&:username)
    render json: names
  end
end
