require 'sidekiq/web'
AirCasting::Application.routes.draw do
  ActiveAdmin.routes(self)

  constraints AdminConstraint.new do
    mount Sidekiq::Web => '/sidekiq'
  end

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

    get 'multiple_sessions' =>'measurement_sessions#show_multiple'

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
      get 'multiple_sessions'   => 'sessions#show_multiple'
      get 'stream_measurements' => 'measurements#stream_measurements'
      get 'streaming_sessions'  => 'sessions#index_streaming'
      get 'sync_measurements'   => 'sessions#sync_measurements'
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
