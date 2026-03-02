FactoryBot.define do
  factory :epa_ingest_cycle do
    window_starts_at { Time.current.beginning_of_hour - 24.hours }
    window_ends_at { Time.current.beginning_of_hour - 1.hour }
    status { 'staging' }
  end
end
