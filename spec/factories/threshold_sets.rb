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

  trait :air_now_pm2_5 do
    sensor_name { 'Government-PM2.5' }
    unit_symbol { 'µg/m³' }
    threshold_very_low { 0 }
    threshold_low { 12 }
    threshold_medium { 35 }
    threshold_high { 55 }
    threshold_very_high { 150 }
  end
end
