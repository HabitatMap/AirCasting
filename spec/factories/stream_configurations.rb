FactoryBot.define do
  factory :stream_configuration do
    measurement_type { 'PM2.5' }
    unit_symbol { 'µg/m³' }
    threshold_very_low { 0 }
    threshold_low { 9 }
    threshold_medium { 35 }
    threshold_high { 55 }
    threshold_very_high { 150 }
    canonical { true }
  end
end
