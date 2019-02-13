require 'rails_helper'

describe TimeToLocalInUTC do
  it 'converts time with timezone to the same time, but in UTC' do
    time = Time.now.in_time_zone('Warsaw')
    expect(time.utc_offset).not_to eq(0)

    str_time = time.strftime('%FT%T')
    new_time = TimeToLocalInUTC.convert(time)

    expect(new_time.utc_offset).to eq(0)
    expect(new_time.strftime('%FT%T')).to eq(str_time)
  end
end
