require 'rails_helper'

describe Session do
  describe '#filter_by_time_range' do
    it 'returns sessions that started and ended in the range' do
      session =
        create_session(
          start_time: Time.new(2_010, 1, 2),
          end_time: Time.new(2_010, 1, 3)
        )

      actual =
        Session.filter_by_time_range(
          Session.all,
          Time.new(2_010, 1, 1),
          Time.new(2_010, 1, 4)
        )

      expect(actual.all).to eq([session])
    end

    it 'returns sessions that started in the range and ended after the range' do
      session =
        create_session(
          start_time: Time.new(2_010, 1, 2),
          end_time: Time.new(2_010, 1, 4)
        )

      actual =
        Session.filter_by_time_range(
          Session.all,
          Time.new(2_010, 1, 1),
          Time.new(2_010, 1, 3)
        )

      expect(actual.all).to eq([session])
    end

    it 'returns sessions that started before the range and ended in the range' do
      session =
        create_session(
          start_time: Time.new(2_010, 1, 1),
          end_time: Time.new(2_010, 1, 3)
        )

      actual =
        Session.filter_by_time_range(
          Session.all,
          Time.new(2_010, 1, 2),
          Time.new(2_010, 1, 4)
        )

      expect(actual.all).to eq([session])
    end

    it 'returns sessions that started before the range and ended after the range' do
      session =
        create_session(
          start_time: Time.new(2_010, 1, 1),
          end_time: Time.new(2_010, 1, 4)
        )

      actual =
        Session.filter_by_time_range(
          Session.all,
          Time.new(2_010, 1, 2),
          Time.new(2_010, 1, 3)
        )

      expect(actual.all).to eq([session])
    end

    it 'does not return sessions that dont overlap with the range' do
      session =
        create_session(
          start_time: Time.new(2_010, 1, 1),
          end_time: Time.new(2_010, 1, 2)
        )

      actual =
        Session.filter_by_time_range(
          Session.all,
          Time.new(2_010, 1, 3),
          Time.new(2_010, 1, 4)
        )

      expect(actual.all).to eq([])
    end

    it 'returns sessions that started and ended in the minutes range' do
      session =
        create_session(
          start_time: Time.new(2_010, 1, 2, 1, 2),
          end_time: Time.new(2_010, 1, 2, 1, 3)
        )

      actual =
        Session.filter_by_time_range(
          Session.all,
          Time.new(2_010, 1, 1, 1, 1),
          Time.new(2_010, 1, 3, 1, 4)
        )

      expect(actual.all).to eq([session])
    end

    it 'returns sessions that started in the range and ended after the minutes range' do
      session =
        create_session(
          start_time: Time.new(2_010, 1, 2, 1, 2),
          end_time: Time.new(2_010, 1, 2, 1, 4)
        )

      actual =
        Session.filter_by_time_range(
          Session.all,
          Time.new(2_010, 1, 1, 1, 1),
          Time.new(2_010, 1, 3, 1, 3)
        )

      expect(actual.all).to eq([session])
    end

    it 'returns sessions that started before the range and ended in the minutes range' do
      session =
        create_session(
          start_time: Time.new(2_010, 1, 2, 1, 1),
          end_time: Time.new(2_010, 1, 2, 1, 3)
        )

      actual =
        Session.filter_by_time_range(
          Session.all,
          Time.new(2_010, 1, 1, 1, 2),
          Time.new(2_010, 1, 3, 1, 4)
        )

      expect(actual.all).to eq([session])
    end

    it 'returns sessions that started before the range and ended after the minutes range' do
      session =
        create_session(
          start_time: Time.new(2_010, 1, 2, 1, 1),
          end_time: Time.new(2_010, 1, 2, 1, 4)
        )

      actual =
        Session.filter_by_time_range(
          Session.all,
          Time.new(2_010, 1, 1, 1, 2),
          Time.new(2_010, 1, 3, 1, 3)
        )

      expect(actual.all).to eq([session])
    end

    it 'does not return sessions that dont overlap with the minutes range even when they are in the date range' do
      session =
        create_session(
          start_time: Time.new(2_010, 1, 2, 1, 1),
          end_time: Time.new(2_010, 1, 2, 1, 2)
        )

      actual =
        Session.filter_by_time_range(
          Session.all,
          Time.new(2_010, 1, 1, 1, 3),
          Time.new(2_010, 1, 3, 1, 4)
        )

      expect(actual.all).to eq([])
    end
  end

  private

  def create_session(attributes)
    session =
      Session.new(
        type: 'FixedSession',
        start_time_local: attributes.fetch(:start_time),
        end_time_local: attributes.fetch(:end_time)
      )
    session.save(validate: false)
    session
  end
end
