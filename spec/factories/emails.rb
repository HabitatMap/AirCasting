FactoryBot.define do
  sequence :email do |n|
    "email#{n}-#{SecureRandom.hex(4)}@factory.com"
  end
end
