source 'http://rubygems.org'

gem 'rails', '3.1.1'
gem 'haml'
gem 'mysql2'
gem 'therubyracer', '~> 0.10' # For ExecJS
gem 'devise', '~> 2.0.4'
gem 'paperclip', '~> 2.0'
gem 'activerecord-import', '~> 0.2.9'
gem 'coffee-script-source', '1.1.2'
gem 'newrelic_rpm'

# Gems used only for assets and not required
# in production environments by default.
group :assets, :development do
  gem 'sass-rails'
  gem 'coffee-rails', '~> 3.1.1'
  gem 'uglifier', '~> 1.2.7'
  gem 'yui-compressor'
end

gem 'acts-as-taggable-on', '~> 2.3.3'
gem 'thin'
gem 'geocoder', '~> 1.1.2'

# To use ActiveModel has_secure_password
# gem 'bcrypt-ruby', '~> 3.0.0'

# Deploy with Capistrano

group :development do
  gem 'capistrano'
  gem 'rvm-capistrano'
  gem 'capistrano-ext'
end
# To use debugger
# gem 'ruby-debug19', :require => 'ruby-debug'

group :test, :development do
  gem 'rspec-rails', '~> 2.11.0'
  gem 'jslint_on_rails'
  gem 'capybara'
  gem 'factory_girl_rails'
  gem 'shoulda-matchers'
  gem 'awesome_print', :require => 'ap'
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
end

group :development do
  gem('flog', :require => nil)
  gem('rails_best_practices', :require => nil)
  gem('churn', :require => nil)
  gem('flay', :require => nil)
end
