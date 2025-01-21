FactoryBot.define do
  factory :stream_daily_average do
    value { 10 }
    date { Date.current }
    stream
  end
end
