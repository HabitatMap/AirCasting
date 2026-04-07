FactoryBot.define do
  factory :device do
    sequence(:mac_address) { |n| "AA:BB:CC:DD:EE:#{n.to_s.rjust(2, '0')}" }
    model { 'AirBeamMini' }
    name { nil }
  end
end
