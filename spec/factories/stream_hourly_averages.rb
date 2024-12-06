FactoryBot.define do
  factory :stream_hourly_average do
    value { 10 }
    date_time { Time.current.beginning_of_hour }
    stream
  end
end
