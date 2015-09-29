module Api
  module V2
    module Data
      class SessionsController < ActionController::Base

        api :GET, '/api/v2/data/sessions/last', 'Show last session'
        formats ['json']
        example '{"id":9586}'

        def last
          render json: IdSerializer.new(Session.last)
        end
      end
    end
  end
end
