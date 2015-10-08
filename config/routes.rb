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
  mount Sidekiq::Web => '/sidekiq'
  mount Flipper::UI.app(Feature.flipper) => '/flipper'
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
  end

  get 'autocomplete/tags' => 'autocomplete#tags'
  get 'autocomplete/usernames' => 'autocomplete#usernames'

  get 'about' => 'static_pages#about'
  get 'donate' => 'static_pages#donate'

  root :to => "home#index"

  # The priority is based upon order of creation:
  # first created -> highest priority.

  # Sample of regular route:
  #   match 'products/:id' => 'catalog#view'
  # Keep in mind you can assign values other than :controller and :action

  # Sample of named route:
  #   match 'products/:id/purchase' => 'catalog#purchase', :as => :purchase
  # This route can be invoked with purchase_url(:id => product.id)

  # Sample resource route (maps HTTP verbs to controller actions automatically):
  #   resources :products

  # Sample resource route with options:
  #   resources :products do
  #     member do
  #       get 'short'
  #       post 'toggle'
  #     end
  #
  #     collection do
  #       get 'sold'
  #     end
  #   end

  # Sample resource route with sub-resources:
  #   resources :products do
  #     resources :comments, :sales
  #     resource :seller
  #   end

  # Sample resource route with more complex sub-resources
  #   resources :products do
  #     resources :comments
  #     resources :sales do
  #       get 'recent', :on => :collection
  #     end
  #   end

  # Sample resource route within a namespace:
  #   namespace :admin do
  #     # Directs /admin/products/* to Admin::ProductsController
  #     # (app/controllers/admin/products_controller.rb)
  #     resources :products
  #   end

  # You can have the root of your site routed with "root"
  # just remember to delete public/index.html.
  # root :to => 'welcome#index'

  # See how all your routes lay out with "rake routes"

  # This is a legacy wild controller route that's not recommended for RESTful applications.
  # Note: This route will make all actions in every controller accessible via GET requests.
  # match ':controller(/:action(/:id(.:format)))'
end
