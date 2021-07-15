require 'sidekiq/web'
require 'sidekiq-scheduler/web'
require 'sidekiq_unique_jobs/web'

Rails.application.routes.draw do
  # For details on the DSL available within this file, see http://guides.rubyonrails.org/routing.html

  ActiveAdmin.routes(self)

  constraints AdminConstraint.new do
    mount Sidekiq::Web => '/sidekiq'
  end

  devise_for :users,
             controllers: { sessions: 'sessions', passwords: 'passwords' }

  get 'map', to: redirect('mobile_map', status: 302)
  get 'mobile_map' => 'maps#index'
  get 'fixed_map' => 'maps#index'

  get 's/:url_token' => 'measurement_sessions#show',
      constraints: { query_string: /.+/ },
      as: :short_session
  get 's/:url_token' => 'measurement_sessions#show_old' # legacy API - supports mobile apps released before 06.2019

  namespace :api do
    namespace :v2 do
      namespace :data do
        resources :sessions, only: [] do
          collection { get :last }
        end
      end
    end

    resources :measurement_sessions, path: 'sessions', only: %i[create] do
      collection do
        get :export
        get :export_by_uuid
      end
    end

    get 'averages' => 'averages#index'
    get 'averages2' => 'averages#index2'
    resources :thresholds, only: %i[show], id: /.*/
    resources :regressions, only: %i[create index destroy]
    resource :region, only: %i[show], controller: 'mobile_regions'
    resource :fixed_region, only: %i[show]
    resource :user, only: %i[show create] do
      resources :sessions, only: %i[show], controller: 'user_sessions' do
        collection do
          post :sync # legacy API - supports mobile apps released before 07.2019
          post :sync_with_versioning
          post :update_session
          post :delete_session
          post :delete_session_streams
        end
      end
      get 'sessions/:uuid' => 'user_sessions#show'
      post 'settings', to: 'users#settings'
    end
    resources :sensors, only: %i[index]

    namespace :realtime do
      get 'sync_measurements' => 'sessions#sync_measurements'
      resources :sessions, only: %i[create show]
      resources :measurements, only: :create do
        collection { post :create_async }
      end
    end

    namespace :fixed do
      get 'sessions/:id' => 'sessions#show'
      get 'sessions2/:id' => 'sessions#show2'
      get 'autocomplete/tags' => 'autocomplete#tags'

      namespace :dormant do
        get 'sessions' => 'sessions#index'
      end

      namespace :active do
        get 'sessions' => 'sessions#index'
      end
    end

    namespace :mobile do
      get 'sessions' => 'sessions#index'
      get 'sessions/:id' => 'sessions#show'
      get 'sessions2/:id' => 'sessions#show2'
      get 'autocomplete/tags' => 'autocomplete#tags'
    end

    get 'measurements' => 'measurements#index'

    resources :short_url, only: %i[index]

    get 'autocomplete/usernames' => 'autocomplete#usernames'
  end
end
