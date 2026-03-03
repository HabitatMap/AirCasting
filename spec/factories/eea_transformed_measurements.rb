FactoryBot.define do
  factory :eea_transformed_measurement do
    external_ref { 'SPO.PL0003A' }
    measurement_type { 'PM2.5' }
    measured_at { Time.zone.parse('2025-07-24 10:00:00') }
    value { 12.5 }
    unit_symbol { 'µg/m³' }
    ingested_at { Time.current }
  end
end
