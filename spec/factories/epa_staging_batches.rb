FactoryBot.define do
  factory :epa_staging_batch do
    association :epa_ingest_cycle
    measured_at { Time.current.beginning_of_hour - 1.hour }
    status { 'queued' }
  end
end
