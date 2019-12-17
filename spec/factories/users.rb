# Read about factories at http://github.com/thoughtbot/factory_bot

FactoryBot.define do
  factory :user do
    email
    password { '12345678' }
    sequence(:username) { |n| "user#{n}" }
  end
end
