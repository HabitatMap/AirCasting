require 'spec_helper'

describe TimeToLocalInUTC do
  it 'converts time with timezone to the same time, but in UTC' do
    time = Time.now.in_time_zone('Warsaw')
    time.utc_offset.should_not == 0

    str_time = time.strftime('%FT%T')
    new_time = TimeToLocalInUTC.convert(time)

    new_time.utc_offset.should == 0
    new_time.strftime('%FT%T').should == str_time
  end
end
