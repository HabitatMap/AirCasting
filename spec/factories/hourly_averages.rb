FactoryBot.define do
  factory :hourly_average do
    station_stream
    value { rand(1..100) }
    measured_at { Time.current.beginning_of_hour }
  end
end
