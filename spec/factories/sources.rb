FactoryBot.define do
  factory :source do
    sequence(:name) { |n| "Source#{n}" }
  end
end
