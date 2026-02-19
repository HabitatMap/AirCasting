FactoryBot.define do
  factory :epa_ingest_batch do
    measured_at { Time.current.beginning_of_hour - 1.hour }
    status { 'queued' }
  end
end
