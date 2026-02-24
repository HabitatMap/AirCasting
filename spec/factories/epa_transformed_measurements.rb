FactoryBot.define do
  factory :epa_transformed_measurement do
    epa_ingest_batch_id { nil }
    external_ref { '060010007' }
    measurement_type { 'PM2.5' }
    measured_at { Time.zone.parse('2025-07-24 10:00:00') }
    value { 12.5 }
    unit_symbol { 'µg/m³' }
    ingested_at { Time.current }
  end
end
