FactoryBot.define do
  factory :epa_load_batch do
    epa_ingest_cycle
    measurement_type { 'PM2.5' }
    status { 'queued' }
  end
end
