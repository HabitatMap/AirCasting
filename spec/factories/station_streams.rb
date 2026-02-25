FactoryBot.define do
  factory :station_stream do
    source
    stream_configuration
    sequence(:external_ref) { |n| "external-ref-#{n}" }
    location { 'SRID=4326;POINT(20.0 50.0)' }
    time_zone { 'Europe/Warsaw' }
    title { 'Test Station' }
    sequence(:url_token) { |n| "token#{n}" }
  end
end
