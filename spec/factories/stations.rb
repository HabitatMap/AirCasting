FactoryBot.define do
  factory :station do
    source
    sequence(:external_ref) { |n| "station-ref-#{n}" }
    location { 'SRID=4326;POINT(20.0 50.0)' }
    time_zone { 'Europe/Warsaw' }
    title { 'Test Station' }
  end
end
