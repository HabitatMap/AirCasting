require 'rails_helper'

RSpec.describe HourlyAverages::Repository do
  subject { described_class.new }

  describe '#calculate_for_hour' do
    let(:eea_source) { create(:source, name: 'EEA') }
    let(:stream_configuration) { create(:stream_configuration) }

    it 'calculates average for measurements in the time range' do
      fixed_stream =
        create(:fixed_stream, source: eea_source, stream_configuration:)

      create(
        :fixed_measurement,
        fixed_stream: fixed_stream,
        measured_at: Time.parse('2026-02-03 10:00 UTC'),
        value: 100,
      )

      create(
        :fixed_measurement,
        fixed_stream: fixed_stream,
        measured_at: Time.parse('2026-02-03 10:30 UTC'),
        value: 10,
      )
      create(
        :fixed_measurement,
        fixed_stream: fixed_stream,
        measured_at: Time.parse('2026-02-03 11:00 UTC'),
        value: 20,
      )

      subject.calculate_for_hour(measured_at: Time.parse('2026-02-03 11:00 UTC'))

      result = HourlyAverage.find_by(fixed_stream: fixed_stream)
      expect(result.value).to eq(15)
      expect(result.measured_at).to eq(Time.parse('2026-02-03 11:00 UTC'))
    end

    it 'handles multiple streams independently' do
      fixed_stream_1 =
        create(:fixed_stream, source: eea_source, stream_configuration:)
      fixed_stream_2 =
        create(:fixed_stream, source: eea_source, stream_configuration:)

      create(
        :fixed_measurement,
        fixed_stream: fixed_stream_1,
        measured_at: Time.parse('2026-02-03 10:30 UTC'),
        value: 10,
      )
      create(
        :fixed_measurement,
        fixed_stream: fixed_stream_2,
        measured_at: Time.parse('2026-02-03 10:30 UTC'),
        value: 100,
      )

      subject.calculate_for_hour(measured_at: Time.parse('2026-02-03 11:00 UTC'))

      expect(HourlyAverage.count).to eq(2)
      expect(HourlyAverage.find_by(fixed_stream: fixed_stream_1).value).to eq(10)
      expect(HourlyAverage.find_by(fixed_stream: fixed_stream_2).value).to eq(100)
    end

    it 'only processes EEA source streams' do
      other_source = create(:source, name: 'OtherSource')
      eea_stream =
        create(:fixed_stream, source: eea_source, stream_configuration:)
      other_stream =
        create(:fixed_stream, source: other_source, stream_configuration:)

      create(
        :fixed_measurement,
        fixed_stream: eea_stream,
        measured_at: Time.parse('2026-02-03 10:30 UTC'),
        value: 10,
      )
      create(
        :fixed_measurement,
        fixed_stream: other_stream,
        measured_at: Time.parse('2026-02-03 10:30 UTC'),
        value: 999,
      )

      subject.calculate_for_hour(measured_at: Time.parse('2026-02-03 11:00 UTC'))

      expect(HourlyAverage.count).to eq(1)
      expect(HourlyAverage.first.fixed_stream).to eq(eea_stream)
    end

    it 'updates existing hourly average on conflict' do
      fixed_stream =
        create(:fixed_stream, source: eea_source, stream_configuration:)

      create(
        :hourly_average,
        fixed_stream: fixed_stream,
        measured_at: Time.parse('2026-02-03 11:00 UTC'),
        value: 999,
      )

      create(
        :fixed_measurement,
        fixed_stream: fixed_stream,
        measured_at: Time.parse('2026-02-03 10:30 UTC'),
        value: 50,
      )

      subject.calculate_for_hour(measured_at: Time.parse('2026-02-03 11:00 UTC'))

      expect(HourlyAverage.count).to eq(1)
      expect(HourlyAverage.first.value).to eq(50)
    end

    it 'creates no record when no measurements exist in the time range' do
      create(:fixed_stream, source: eea_source, stream_configuration:)

      subject.calculate_for_hour(measured_at: Time.parse('2026-02-03 11:00 UTC'))

      expect(HourlyAverage.count).to eq(0)
    end
  end
end
