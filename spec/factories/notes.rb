FactoryBot.define do
  factory :note do
    latitude { 10.12 }
    longitude { 12.12 }
    text { 'Hello note!' }
    date { Time.now }
    number { 10 }
    association :session, factory: :mobile_session

    trait :with_photo do
      after(:build) do |note|
        note.s3_photo.attach(
          io: File.open(Rails.root.join('spec', 'fixtures', 'test.jpg')),
          filename: 'test_image.jpg',
          content_type: 'image/jpeg',
        )
      end
    end
  end
end
