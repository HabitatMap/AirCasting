FactoryBot.define do
  factory :source do
    sequence(:name) { |n| "Source#{n}" }
    sequence(:full_name) { |n| "Source Full Name #{n}" }
  end
end
