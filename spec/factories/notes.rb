FactoryBot.define do
  factory :note do
    latitude { 10.12 }
    longitude { 12.12 }
    text { 'Hello note!' }
    date { Time.now }
    number { 10 }
    association :session, factory: :mobile_session
  end
end
