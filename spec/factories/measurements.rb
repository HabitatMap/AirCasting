# Read about factories at http://github.com/thoughtbot/factory_bot

FactoryBot.define do
  factory :measurement do
    value { 12.3456 }
    longitude { 50.1234 }
    latitude { 11.12 }
    time { Time.parse('2011-10-21T14:51:54Z') }
    stream
  end
end
