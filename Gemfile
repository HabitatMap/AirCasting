source 'http://rubygems.org'

gem 'rails', '3.2.13'
gem 'haml'
gem 'devise', '~> 2.0.5'
gem 'paperclip', '~> 2.0'
gem 'activerecord-import', '~> 0.2.9'
gem 'coffee-script-source', '1.1.2'
gem 'newrelic_rpm'
gem 'activeadmin'

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

# To use ActiveModel has_secure_password
# gem 'bcrypt-ruby', '~> 3.0.0'

# Deploy with Capistrano

group :development do
  gem 'capistrano'
  gem 'rvm-capistrano'
  gem 'capistrano-ext'
  gem 'pry'
end
# To use debugger
# gem 'ruby-debug19', :require => 'ruby-debug'

group :test, :development do
  gem 'rspec-rails'
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
  platforms :ruby do
    gem 'unicorn'
    gem 'rainbows'
  end
end

group :development do
  gem('flog', :require => nil)
  gem('rails_best_practices', :require => nil)
  gem('churn', :require => nil)
  gem('flay', :require => nil)
end
