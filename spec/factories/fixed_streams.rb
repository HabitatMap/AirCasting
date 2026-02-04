FactoryBot.define do
  factory :fixed_stream do
    source
    sequence(:external_ref) { |n| "external-ref-#{n}" }
    location { 'SRID=4326;POINT(20.0 50.0)' }
    time_zone { 'Europe/Warsaw' }
    title { 'Test Station' }
    sequence(:url_token) { |n| "token#{n}" }
  end
end
