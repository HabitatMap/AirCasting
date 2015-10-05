module Api
  module V2
    module Data
      class SessionsController < ActionController::Base
        def last
          render json: IdSerializer.new(Session.last)
        end
      end
    end
  end
end
