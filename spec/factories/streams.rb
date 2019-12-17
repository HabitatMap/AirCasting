# Read about factories at http://github.com/thoughtbot/factory_bot

FactoryBot.define do
  factory :stream do
    sensor_name { 'LHC' }
    sensor_package_name { 'CERN' }
    unit_name { 'number' }
    measurement_type { 'hadrons' }
    measurement_short_type { 'hd' }
    unit_symbol { '#' }
    threshold_very_low { 1 }
    threshold_low { 2 }
    threshold_medium { 3 }
    threshold_high { 4 }
    threshold_very_high { 5 }
    association :session, factory: :mobile_session
  end
end
