# Read about factories at http://github.com/thoughtbot/factory_bot

FactoryBot.define do
  factory :mobile_session do
    user
    sequence(:uuid) { |n| "uuid-#{n}" }
    title { 'Another session' }
    tag_list { 'boring quiet' }
    contribute { true }
    notes_attributes { [FactoryBot.attributes_for(:note, session: nil)] }
    start_time { Time.now }
    end_time { Time.now + 1.minute }
    start_time_local { Time.now }
    end_time_local { Time.now + 1.minute }
  end
end
