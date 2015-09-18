source 'http://rubygems.org'

gem 'rake', '10.0.3'
gem 'rails', '3.2.22'
gem 'haml'
gem 'devise', '~> 2.0.5'
gem 'paperclip', '~> 2.0'
gem 'activerecord-import', '~> 0.2.9'
gem 'coffee-script-source', '1.1.2'
gem 'newrelic_rpm'
gem 'activeadmin'
gem 'sidekiq'
gem 'progress', require: false
gem 'pry-rails'

gem 'rb-gsl', '1.16.0.1'

gem 'rubyzip', '>= 1.0.0'

gem 'elasticsearch-model'
gem 'elasticsearch-rails'
gem 'flipper'
gem 'flipper-redis'
gem 'flipper-ui'

platforms :jruby do
  gem 'jdbc-mysql', :platform => :jruby
  gem 'activerecord-jdbc-adapter', :require => false
  gem 'therubyrhino', :platform => :jruby
end

platforms :ruby do
  gem 'mysql2', :platform => :ruby
  gem 'therubyracer', '~> 0.10', :platform => :ruby # For ExecJS
  gem 'thin'
end

# Gems used only for assets and not required
# in production environments by default.
group :assets, :development do
  gem 'sass-rails', '~> 3.2.2'
  gem 'coffee-rails', '~> 3.2.1'
  gem 'uglifier', '~> 1.2.7'
  gem 'yui-compressor'
end

gem 'acts-as-taggable-on', '~> 2.3.3'
gem 'geocoder', '~> 1.1.2'

# deploy with capistrano
group :development do
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
  platforms :ruby do
    gem 'unicorn'
    gem 'rainbows'
  end
end

group :development do
  gem 'awesome_print'
  gem 'metric_fu'
  gem 'quiet_assets'
end
