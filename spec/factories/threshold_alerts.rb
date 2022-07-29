FactoryBot.define do
  factory :threshold_alert do
    user_id { 123 }
    session_uuid { '123-4566' }
    sensor_name { 'PM2.5' }
    frequency { 1 }
    last_email_at { 1.hour.ago }
  end
end
