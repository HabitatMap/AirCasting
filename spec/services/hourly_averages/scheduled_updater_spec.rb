require 'rails_helper'

RSpec.describe HourlyAverages::ScheduledUpdater do
  subject { described_class.new }

  describe '#call' do
    let(:eea_source) { create(:source, name: 'EEA') }
    let(:stream_configuration) { create(:stream_configuration) }

    it 'creates hourly averages for measurements within the lookback window' do
      fixed_stream =
        create(:fixed_stream, source: eea_source, stream_configuration:)
      create(
        :fixed_measurement,
        fixed_stream: fixed_stream,
        measured_at: Time.parse('2026-02-03 10:30 UTC'),
        value: 10,
      )
      create(
        :fixed_measurement,
        fixed_stream: fixed_stream,
        measured_at: Time.parse('2026-02-03 14:30 UTC'),
        value: 20,
      )
      create(
        :fixed_measurement,
        fixed_stream: fixed_stream,
        measured_at: Time.parse('2026-02-03 8:30 UTC'),
        value: 200,
      )


      travel_to(Time.parse('2026-02-03 15:30 UTC')) { subject.call }

      expect(HourlyAverage.count).to eq(2)
      expect(
        HourlyAverage.find_by(measured_at: Time.parse('2026-02-03 11:00 UTC')).value,
      ).to eq(10)
      expect(
        HourlyAverage.find_by(measured_at: Time.parse('2026-02-03 15:00 UTC')).value,
      ).to eq(20)
    end

    it 'recalculates hourly average when new measurements arrive' do
      fixed_stream =
        create(:fixed_stream, source: eea_source, stream_configuration:)
      hourly_average =
        create(
          :hourly_average,
          fixed_stream: fixed_stream,
          measured_at: Time.parse('2026-02-03 15:00 UTC'),
          value: 10,
        )
      create(
        :fixed_measurement,
        fixed_stream: fixed_stream,
        measured_at: Time.parse('2026-02-03 14:30 UTC'),
        value: 30,
      )

      travel_to(Time.parse('2026-02-03 15:30 UTC')) { subject.call }

      expect(hourly_average.reload.value).to eq(30)
    end
  end
end
