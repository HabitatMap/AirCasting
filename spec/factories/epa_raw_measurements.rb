FactoryBot.define do
  factory :epa_raw_measurement do
    epa_staging_batch_id { nil }
    valid_date { '07/24/25' }
    valid_time { '09:00' }
    aqsid { '060010007' }
    sitename { 'Test Site' }
    gmt_offset { '-8' }
    parameter_name { 'PM2.5' }
    reporting_units { 'µg/m³' }
    value { '12.5' }
    data_source { 'TEST' }
  end
end
