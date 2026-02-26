FactoryBot.define do
  factory :station_measurement do
    station_stream
    measured_at { Time.current }
    value { 12.5 }
  end
end
