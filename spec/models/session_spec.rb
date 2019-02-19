require 'rails_helper'

describe Session do
  describe "#day_range" do
    it "with day in the middle of the range it returns it" do
      yesterday = 1
      today = 2
      tomorrow = 3
      time = Time.new(2001, 01, today)
      create_session(time)

      actual = Session.day_range(yesterday, tomorrow)

      expect(actual.size).to eq(1)
    end

    it "with day out of the range it does not return it" do
      today = 1
      tomorrow = 2
      day_after_tomorrow = 3
      time = Time.new(2001, 01, today)
      create_session(time)

      actual = Session.day_range(tomorrow, day_after_tomorrow)

      expect(actual.size).to eq(0)
    end

    it "Feb 28th and 29th are both the 59th day of the year" do
      leap_year = 2000
      common_year = 2001
      time1 = Time.new(leap_year, 02, 29)
      time2 = Time.new(common_year, 02, 28)
      create_session(time1)
      create_session(time2)

      actual = Session.day_range(59, 59)

      expect(actual.size).to eq(2)
    end
  end

  private

  def create_session(start_time)
    session = Session.new(
      type: 'FixedSession',
      start_time: start_time
    )
    session.save(validate: false)
  end
end
