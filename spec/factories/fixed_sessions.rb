# Read about factories at http://github.com/thoughtbot/factory_bot

FactoryBot.define do
  factory :fixed_session do
    user
    sequence(:uuid) { |n| "fixed-uuid-#{n}" }
    title { 'Another session' }
    tag_list { 'boring quiet' }
    contribute { true }
    notes_attributes { [FactoryBot.attributes_for(:note, session: nil)] }
    start_time_local { Time.now }
    end_time_local { Time.now + 1.minute }
    is_indoor { false }
    latitude { 11.12 }
    longitude { 50.1234 }
  end
end
