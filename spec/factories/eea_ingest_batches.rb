FactoryBot.define do
  factory :eea_ingest_batch do
    country { 'FR' }
    pollutant { 'PM2.5' }
    window_starts_at { Time.current.beginning_of_hour - 6.hours }
    window_ends_at { Time.current.beginning_of_hour }
    status { 'transformed' }
  end
end
