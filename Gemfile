source 'https://rubygems.org'

gem 'rake', '10.0.3'
gem 'rails', '3.2.22.2'
gem 'haml'
gem 'devise', '~> 2.0.5'
gem 'paperclip', '~> 2.8.0'
gem 'activerecord-import', '~> 0.2.9'
gem 'coffee-script-source', '1.1.2'
gem 'newrelic_rpm', '~> 3.14', '>= 3.14.0.305'
gem 'honeybadger', '~> 2.0'
gem 'activeadmin'
gem 'sidekiq', '~> 3.1.4'
gem 'sidekiq-unique-jobs', '3.0.12'
gem 'colored', require: false
gem 'progress', require: false
gem 'pry-rails'

gem 'rb-gsl', '1.16.0.6'

gem 'rubyzip', '>= 1.0.0'

gem 'elasticsearch-model', '~> 0.1.8'
gem 'elasticsearch-rails', '~> 0.1.8'
FLIPPER_VERSION = '~> 0.7.1'
gem 'flipper', FLIPPER_VERSION
gem 'flipper-redis', FLIPPER_VERSION
gem 'flipper-ui', FLIPPER_VERSION
gem 'sinatra', require: false

gem 'mysql2'
gem 'thin', '~> 1.6', '>= 1.6.4'

# Gems used only for assets and not required
# in production environments by default.
group :assets, :development do
  gem 'sass-rails', '~> 3.2.2'
  gem 'coffee-rails', '~> 3.2.1'
  gem 'uglifier', '~> 1.2.7'
  gem 'yui-compressor'
end

gem 'acts-as-taggable-on', '~> 2.3.3'
gem 'geocoder', '~> 1.2'

group :development do
  gem 'better_errors'
  gem 'binding_of_caller'
  gem 'pry-byebug'
  gem 'capistrano'
  gem 'capistrano-ext'
  gem 'capistrano-sidekiq'
  gem 'capistrano-unicorn', require: false
  gem 'rvm-capistrano', require: false
end

group :test, :development do
  gem 'rspec-rails'
  gem 'jslint_on_rails'
  gem 'capybara'
  gem 'factory_girl_rails'
  gem 'shoulda-matchers'
  gem 'guard', :require => false
  gem 'guard-rspec', :require => false
  gem 'guard-spork', :require => false
  gem 'guard-bundler'
  gem 'guard-coffeescript'
  gem 'spork', '~> 0.9.0', :require => false
  gem 'libnotify', :require => false
  gem 'rb-inotify', :require => false
  gem 'jasmine-rails'
end

group :production do
  gem 'unicorn'
  gem 'rainbows'
end

group :development do
  gem 'awesome_print'
  gem 'metric_fu'
  gem 'quiet_assets'
end

ANGULAR_VERSION = '~> 1.2.29'

source 'https://rails-assets.org' do
  gem 'rails-assets-angular', ANGULAR_VERSION
  gem 'rails-assets-angular-route', ANGULAR_VERSION
  gem 'rails-assets-angular-cookies', ANGULAR_VERSION
  gem 'rails-assets-underscore', '~> 1.8.3'
  gem 'rails-assets-underscore.string', '~> 2.4.0'
end
