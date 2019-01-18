require 'rubygems'
require 'spork'

Spork.prefork do
  # This file is copied to spec/ when you run 'rails generate rspec:install'
  ENV["RAILS_ENV"] ||= 'test'
  require File.expand_path("../../config/environment", __FILE__)
  require 'rspec/rails'
  require 'rspec/autorun'

  # Add this to load Capybara integration:
  require 'capybara/rspec'
  require 'capybara/rails'
end

Spork.each_run do
  # Requires supporting ruby files with custom matchers and macros, etc,
  # in spec/support/ and its subdirectories.
  Dir[Rails.root.join("spec/support/**/*.rb")].each {|f| require f}

  RSpec.configure do |config|
    # == Mock Framework
    #
    # If you prefer to use mocha, flexmock or RR, uncomment the appropriate line:
    #
    # config.mock_with :mocha
    # config.mock_with :flexmock
    # config.mock_with :rr
    config.mock_with :rspec

    # Remove this line if you're not using ActiveRecord or ActiveRecord fixtures
    config.fixture_path = "#{::Rails.root}/spec/fixtures"

    # If you're not using ActiveRecord, or you'd prefer not to run each of your
    # examples within a transaction, remove the following line or assign false
    # instead of true.
    config.use_transactional_fixtures = true

    # If true, the base class of anonymous controllers will be inferred
    # automatically. This will be the default behavior in future versions of
    # rspec-rails.
    config.infer_base_class_for_anonymous_controllers = false

    config.include Devise::TestHelpers, :type => :controller
    config.include Aircasting::ControllerHelpers, :type => :controller

    config.include Aircasting::ModelHelpers, :type => :model

    config.include Capybara::DSL, :type => :request

    # rspec-rails 3 will no longer automatically infer an example group's spec type
    # from the file location. You can explicitly opt-in to the feature using this
    # config option.
    # To explicitly tag specs without using automatic inference, set the `:type`
    # metadata manually:
    #
    #     describe ThingsController, :type => :controller do
    #       # Equivalent to being in spec/controllers
    #     end
    config.infer_spec_type_from_file_location!
  end
end

Shoulda::Matchers.configure do |config|
  config.integrate do |with|
    with.test_framework :rspec
    with.library :rails
  end
end
