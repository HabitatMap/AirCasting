require 'sidekiq/web'
require 'sidekiq-scheduler/web'
require 'sidekiq_unique_jobs/web'

Rails.application.routes.draw do
  # For details on the DSL available within this file, see http://guides.rubyonrails.org/routing.html

  root 'client_app#index'

  ActiveAdmin.routes(self)

  constraints AdminConstraint.new do
    mount Sidekiq::Web => '/sidekiq'
  end

  devise_for :users,
             controllers: {
               sessions: 'sessions',
               passwords: 'passwords',
             }

  get 'map', to: redirect('/', status: 302)
  get 'mobile_map', to: redirect('/new_map', status: 302)
  get 'fixed_map', to: redirect('/new_map', status: 302)

  get 's/:url_token' => 'measurement_sessions#show',
      :constraints => {
        query_string: /.+/,
      },
      :as => :short_session

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
    resource :region, only: %i[show], controller: 'mobile_regions'
    resource :fixed_region, only: %i[show]
    resource :user, only: %i[show create destroy] do
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
      post 'delete_account_send_code',
           to: 'confirmation_code#request_account_deletion'
      post 'delete_account_confirm',
           to: 'users#delete_account_with_confirmation_code'
    end
    resources :sensors, only: %i[index]

    namespace :realtime do
      get 'sync_measurements' => 'sessions#sync_measurements'
      resources :sessions, only: %i[create show]
      resources :measurements, only: :create
    end

    namespace :fixed do
      get 'sessions/:id/streams' => 'sessions#show_all_streams'
      get 'streams/:id' => 'streams#show'
      get 'autocomplete/tags' => 'autocomplete#tags'

      namespace :dormant do
        get 'sessions' => 'sessions#index'
      end

      namespace :active do
        get 'sessions' => 'sessions#index'
        get 'sessions2' => 'sessions#index2'
      end

      resources :threshold_alerts, only: %i[index create destroy]
      post 'destroy_alert' => 'threshold_alerts#destroy_alert'
    end

    namespace :mobile do
      get 'sessions' => 'sessions#index'
      get 'sessions2/:id' => 'sessions#show2'
      get 'streams/:id' => 'streams#show'
      get 'autocomplete/tags' => 'autocomplete#tags'
    end

    namespace :v3 do
      resources :fixed_streams, only: %i[show]
      resources :stream_daily_averages, only: %i[index]
      resources :streams, only: %i[index]
      get 'timelapse' => 'fixed_stream_clusters#index'
    end

    get 'measurements' => 'measurements#index'

    resources :short_url, only: %i[index]

    get 'autocomplete/usernames' => 'autocomplete#usernames'
  end

  get '*path', to: 'client_app#index', via: :all
end
