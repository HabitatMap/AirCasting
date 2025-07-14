FactoryBot.define do
  factory :fixed_measurement do
    stream
    value { rand(1..100) }
    time { Time.current }
    time_with_time_zone { Time.current.utc }
  end
end
