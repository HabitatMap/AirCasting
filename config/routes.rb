# AirCasting - Share your Air!
# Copyright (C) 2011-2012 HabitatMap, Inc.
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Affero General Public License for more details.
#
# You should have received a copy of the GNU Affero General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.
#
# You can contact the authors by email at <info@habitatmap.org>

require 'sidekiq/web'
AirCasting::Application.routes.draw do
  ActiveAdmin.routes(self)

  constraints AdminConstraint.new do
    mount Sidekiq::Web => '/sidekiq'
    mount Flipper::UI.app(Feature.flipper) => '/flipper'
  end

  mount JasmineRails::Engine => "/specs" if defined?(JasmineRails)

  devise_for :users, :controllers => { :sessions => 'sessions', :passwords => 'passwords' }

  resource :map

  match 's/:url_token' => 'measurement_sessions#show', :as => :short_session

  namespace :api do
    namespace :v2 do
      namespace :data do
        resources :sessions, only: [] do
          collection do
            get :last
          end
        end
      end
    end

    resources :measurement_sessions, path: 'sessions', only: [:show, :create, :index] do
      collection do
        get :export
      end
    end
    resources :averages, only: [:index]
    resources :thresholds, only: [:show], id: /.*/
    resources :regressions, only: [:create, :index, :destroy]
    resource :region, only: [:show]
    resource  :user, only: [:show, :create] do
      resources :sessions, only: [:show], controller: "user_sessions" do
        collection do
          post :sync
          post :delete_session
          post :delete_session_streams
        end
      end
    end
    resources :sensors, only: [:index]

    namespace :realtime do
      resources :sessions, only: [:create, :index, :show]
      resources :measurements, only: :create
    end
  end

  get 'autocomplete/tags' => 'autocomplete#tags'
  get 'autocomplete/usernames' => 'autocomplete#usernames'

  get 'about' => 'static_pages#about'
  get 'donate' => 'static_pages#donate'

  root :to => "home#index"
end
