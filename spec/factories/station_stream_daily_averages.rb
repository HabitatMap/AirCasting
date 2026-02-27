FactoryBot.define do
  factory :station_stream_daily_average do
    station_stream
    date { Date.current }
    value { 10 }
  end
end
