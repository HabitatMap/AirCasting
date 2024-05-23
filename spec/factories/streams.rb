# Read about factories at http://github.com/thoughtbot/factory_bot

FactoryBot.define do
  factory :stream do
    sensor_name { 'LHC' }
    sensor_package_name { 'CERN' }
    unit_name { 'number' }
    measurement_type { 'hadrons' }
    measurement_short_type { 'hd' }
    unit_symbol { '#' }
    threshold_set
    association :session, factory: :mobile_session
  end
end
