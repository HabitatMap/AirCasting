require 'sidekiq/web'
Rails.application.routes.draw do
  ActiveAdmin.routes(self)

  constraints AdminConstraint.new do
    mount Sidekiq::Web => '/sidekiq'
  end

  devise_for :users, :controllers => { :sessions => 'sessions', :passwords => 'passwords' }

  get 'map', to: redirect('mobile_map', status: 302)
  get 'mobile_map' => 'maps#index'
  get 'fixed_map' => 'maps#index'

  get 's/:url_token' => 'measurement_sessions#show', constraints: { query_string: /.+/ }, :as => :short_session
  get 's/:url_token' => 'measurement_sessions#show_old'   # supports mobile apps relesed before 06.2019

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

    resources :measurement_sessions, path: 'sessions', only: [:create] do
      collection do
        get :export
      end
    end

    get 'multiple_sessions' =>'measurement_sessions#show_multiple'

    resources :averages, only: [:index]
    resources :thresholds, only: [:show], id: /.*/
    resources :regressions, only: [:create, :index, :destroy]
    resource :region, only: [:show], controller: "mobile_regions"
    resource :fixed_region, only: [:show]
    resource  :user, only: [:show, :create] do
      resources :sessions, only: [:show], controller: "user_sessions" do
        collection do
          post :sync
          post :delete_session
          post :delete_session_streams
        end
      end
      get 'sessions/:uuid' => 'user_sessions#show'
    end
    resources :sensors, only: [:index]

    namespace :realtime do
      get 'multiple_sessions'   => 'sessions#show_multiple'
      get 'streaming_sessions'  => 'sessions#index_streaming'
      get 'sync_measurements'   => 'sessions#sync_measurements'
      resources :sessions, only: [:create, :show]
      resources :measurements, only: :create
    end

    namespace :fixed do
      get "sessions/:id" => "sessions#show"
      get "sessions2/:id" => "sessions#show2"

      namespace :dormant do
        get "sessions" => "sessions#index"
      end
    end

    namespace :mobile do
      get "sessions" => "sessions#index"
      get "sessions/:id" => "sessions#show"
      get "sessions2/:id" => "sessions#show2"
    end

    get "measurements" => "measurements#index"

    resources :short_url, only: [:index]
  end

  get 'autocomplete/tags' => 'autocomplete#tags'
  get 'autocomplete/usernames' => 'autocomplete#usernames'

  get 'about' => 'static_pages#about'
  get 'donate' => 'static_pages#donate'


  root :to => "home#index"
end
