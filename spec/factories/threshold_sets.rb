# Read about factories at http://github.com/thoughtbot/factory_bot

FactoryBot.define do
  factory :threshold_set do
    sensor_name { 'LHC' }
    unit_symbol { '#' }
    threshold_very_low { 1 }
    threshold_low { 2 }
    threshold_medium { 3 }
    threshold_high { 4 }
    threshold_very_high { 5 }
  end
end
