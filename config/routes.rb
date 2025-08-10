Rails.application.routes.draw do
  namespace :admin do
    get 'dashboard/index'
  end
  get 'home/index'
  devise_for :users
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  # get "up" => "rails/health#show", as: :rails_health_check

  # Defines the root path route ("/")
  # root "posts#index"

  namespace :api do
    namespace :v1 do
      post 'login', to: 'authentication#login'
      delete 'logout', to: 'authentication#logout'

      resources :products
      resources :categories
      resources :orders
      resources :payments
      post 'checkout', to: 'checkout#create'
    end
  end

  # Frontend route - will be handled by React Router
  get '*path', to: 'home#index', constraints: ->(req) { !req.xhr? && req.format.html? }
  root 'home#index'
end
