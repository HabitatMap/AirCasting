# Read about factories at http://github.com/thoughtbot/factory_bot

FactoryBot.define do
  factory :region do
    north { 51.1234 }
    south { 50.1234 }
    east { 20.1234 }
    west { 20.1234 }
  end
end
